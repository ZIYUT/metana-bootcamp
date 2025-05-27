// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./libraries/TickMath.sol";
import "./interfaces/ArbitrageInterfaces.sol";
import "./libraries/PriceLibrary.sol";
import "./ArbitrageSwapper.sol";

/**
 * @title ArbitrageExecutor
 * @dev Contract to manage arbitrage opportunities between DEXes
 * Uses Chainlink Automation for monitoring and flash loans for execution
 */
contract ArbitrageExecutor is Ownable, AutomationCompatibleInterface, IFlashLoanReceiver {
    using SafeERC20 for IERC20;
    
    // Constants
    address public immutable WETH = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    address public immutable USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    uint24 public constant UNISWAP_FEE = 3000; // 0.3% fee tier
    
    // Protocol addresses
    address public immutable uniswapPool;
    address public immutable sushiswapPair;
    address public immutable uniswapRouter = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public immutable sushiswapRouter = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address public immutable lendingPool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    ArbitrageSwapper public immutable swapper;
    
    // Arbitrage parameters
    uint256 public minProfitAmount = 0.001 ether; // 1/10 of current value
    uint256 public minPriceDeviation = 50;        // 0.5% instead of 0.2%
    uint256 public maxFlashLoanAmount = 100 ether; // Maximum amount to borrow in flash loan
    
    // Tracking variables
    uint256 public totalProfits;
    uint256 public executedArbitrages;
    uint256 public lastExecutionTimestamp;
    uint256 public minExecutionInterval = 300; // 5 minutes between executions
    
    // Events
    event ArbitrageExecuted(
        address indexed fromPool,
        address indexed toPool,
        uint256 amountIn,
        uint256 amountOut,
        uint256 profit,
        uint256 flashLoanFee
    );
    event ParametersUpdated(uint256 minProfitAmount, uint256 minPriceDeviation, uint256 maxFlashLoanAmount);
    event Error(string message);
    event UpkeepCheck(uint256 uniswapPrice, uint256 sushiswapPrice, uint256 priceDiff, bool upkeepNeeded);
    event ExecutionSkipped(string reason);
    event ArbitrageFailed(string reason, string details);

    /**
     * @dev Constructor to set initial protocol addresses
     */
    constructor(
        address _uniswapPool,
        address _sushiswapPair,
        address _swapper
    ) Ownable(msg.sender) {
        uniswapPool = _uniswapPool;
        sushiswapPair = _sushiswapPair;
        swapper = ArbitrageSwapper(_swapper);
        lastExecutionTimestamp = block.timestamp; // Initialize lastExecutionTimestamp
    }
    
    /**
     * @dev Required by Chainlink Automation - checks if upkeep is needed
     * @return upkeepNeeded Whether arbitrage should be performed
     * @return performData Additional data to be used by performUpkeep
     */
    function checkUpkeep(bytes calldata) external override returns (bool upkeepNeeded, bytes memory performData) {
        try PriceLibrary.getCurrentPrices(uniswapPool, sushiswapPair) returns (uint256 uniswapPrice, uint256 sushiswapPrice) {
            // Check if prices are valid
            if (uniswapPrice == 0 || sushiswapPrice == 0) {
                emit Error("Invalid price data");
                return (false, bytes(""));
            }
            
            (uint256 priceDiff, bool firstHigher) = PriceLibrary.calculatePriceDifference(
                uniswapPrice, 
                sushiswapPrice
            );
            
            bool uniswapToSushi = !firstHigher;
            
            // More comprehensive conditions for upkeep
            upkeepNeeded = (
                priceDiff >= minPriceDeviation && 
                block.timestamp >= lastExecutionTimestamp + minExecutionInterval &&
                uniswapPrice > 0 &&
                sushiswapPrice > 0
            );
            
            // Log the check results
            emit UpkeepCheck(uniswapPrice, sushiswapPrice, priceDiff, upkeepNeeded);
            
            if (upkeepNeeded) {
                performData = abi.encode(uniswapToSushi);
            } else {
                if (priceDiff < minPriceDeviation) {
                    emit ExecutionSkipped("Insufficient price deviation");
                } else if (block.timestamp < lastExecutionTimestamp + minExecutionInterval) {
                    emit ExecutionSkipped("Too soon since last execution");
                } else if (uniswapPrice == 0 || sushiswapPrice == 0) {
                    emit ExecutionSkipped("Invalid price data");
                }
            }
        } catch {
            emit Error("Price check failed");
            return (false, bytes(""));
        }
        
        return (upkeepNeeded, performData);
    }
    
    /**
     * @dev Required by Chainlink Automation - executes the arbitrage
     * @param performData Data (direction of arbitrage) passed from checkUpkeep
     */
    function performUpkeep(bytes calldata performData) external override {
        // Decode the performData
        bool uniswapToSushi = abi.decode(performData, (bool));
        
        // Verify if upkeep is still needed
        (uint256 uniswapPrice, uint256 sushiswapPrice) = PriceLibrary.getCurrentPrices(uniswapPool, sushiswapPair);
        (uint256 priceDiff, bool firstHigher) = PriceLibrary.calculatePriceDifference(
            uniswapPrice, 
            sushiswapPrice
        );
        
        // Ensure price conditions still match expected direction
        require(
            (uniswapToSushi && !firstHigher) || (!uniswapToSushi && firstHigher),
            "Price conditions changed"
        );
        require(priceDiff >= minPriceDeviation, "Insufficient price deviation");
        require(block.timestamp >= lastExecutionTimestamp + minExecutionInterval, "Too soon since last execution");
        
        // Calculate optimal loan amount based on price difference
        uint256 loanAmount = PriceLibrary.calculateOptimalLoanAmount(priceDiff);
        loanAmount = loanAmount > maxFlashLoanAmount ? maxFlashLoanAmount : loanAmount;
        
        // Initialize flash loan
        address[] memory assets = new address[](1);
        assets[0] = WETH;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = loanAmount;
        
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0; // no debt - flash loan
        
        // Encode arbitrage parameters for the callback
        bytes memory params = abi.encode(uniswapToSushi);
        
        // Execute flash loan
        ILendingPool(lendingPool).flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            address(this), // onBehalfOf
            params,
            0 // referralCode
        );
        
        // Update last execution timestamp
        lastExecutionTimestamp = block.timestamp;
    }
    
    /**
     * @dev Flash loan callback function
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == lendingPool, "Caller must be lending pool");
        require(initiator == address(this), "Initiator must be this contract");
        require(assets.length == 1 && assets[0] == WETH, "Invalid assets");
        require(amounts.length == 1 && amounts[0] <= maxFlashLoanAmount, "Invalid amounts");
        require(premiums.length == 1, "Invalid premiums");

        // 解析参数
        (address _uniswapPool, address _sushiswapPair, bool _firstHigher) = abi.decode(
            params,
            (address, address, bool)
        );

        // 获取当前价格
        (uint256 uniswapPrice, uint256 sushiswapPrice) = PriceLibrary.getCurrentPrices(
            _uniswapPool,
            _sushiswapPair
        );

        // 计算价差
        (uint256 priceDiff, bool firstHigher) = PriceLibrary.calculatePriceDifference(
            uniswapPrice,
            sushiswapPrice
        );

        // 验证价差
        require(priceDiff >= minPriceDeviation, "Price deviation too small");
        require(firstHigher == _firstHigher, "Price direction changed");

        // 计算交易金额
        uint256 amountIn = amounts[0];
        uint256 flashLoanFee = premiums[0];
        uint256 totalRepayAmount = amountIn + flashLoanFee;

        // 执行套利
        uint256 amountOut;
        if (firstHigher) {
            // Uniswap -> SushiSwap
            try IUniswapV3Pool(_uniswapPool).swap(
                address(this),
                true,
                int256(amountIn),
                TickMath.MAX_SQRT_RATIO - 1,
                abi.encode(_sushiswapPair, true)
            ) {
                amountOut = IERC20(USDC).balanceOf(address(this));
                require(amountOut > 0, "No tokens received from Uniswap");
            } catch Error(string memory reason) {
                emit ArbitrageFailed("Uniswap swap failed", reason);
                revert("Uniswap swap failed");
            } catch {
                emit ArbitrageFailed("Uniswap swap failed", "Unknown error");
                revert("Uniswap swap failed");
            }
        } else {
            // SushiSwap -> Uniswap
            try ISushiswapPair(_sushiswapPair).swap(
                0,
                amountIn,
                address(this),
                abi.encode(_uniswapPool, false)
            ) {
                amountOut = IERC20(USDC).balanceOf(address(this));
                require(amountOut > 0, "No tokens received from SushiSwap");
            } catch Error(string memory reason) {
                emit ArbitrageFailed("SushiSwap swap failed", reason);
                revert("SushiSwap swap failed");
            } catch {
                emit ArbitrageFailed("SushiSwap swap failed", "Unknown error");
                revert("SushiSwap swap failed");
            }
        }

        // 验证利润
        uint256 profit = amountOut - totalRepayAmount;
        require(profit >= minProfitAmount, "Insufficient profit");

        // 更新统计
        totalProfits += profit;
        executedArbitrages += 1;

        // 记录成功事件
        emit ArbitrageExecuted(
            firstHigher ? _uniswapPool : _sushiswapPair,
            firstHigher ? _sushiswapPair : _uniswapPool,
            amountIn,
            amountOut,
            profit,
            flashLoanFee
        );

        // 授权闪电贷还款
        IERC20(WETH).approve(lendingPool, totalRepayAmount);

        return true;
    }
    
    /**
     * @dev Update arbitrage parameters
     * @param _minProfitAmount Minimum profit to execute arbitrage
     * @param _minPriceDeviation Minimum price deviation (basis points)
     * @param _maxFlashLoanAmount Maximum amount for flash loan
     */
    function updateParameters(
        uint256 _minProfitAmount,
        uint256 _minPriceDeviation,
        uint256 _maxFlashLoanAmount
    ) external onlyOwner {
        minProfitAmount = _minProfitAmount;
        minPriceDeviation = _minPriceDeviation;
        maxFlashLoanAmount = _maxFlashLoanAmount;
        
        emit ParametersUpdated(_minProfitAmount, _minPriceDeviation, _maxFlashLoanAmount);
    }
    
    /**
     * @dev Set minimum time between arbitrage executions
     */
    function setMinExecutionInterval(uint256 _minExecutionInterval) external onlyOwner {
        minExecutionInterval = _minExecutionInterval;
    }
    
    /**
     * @dev Withdraw profits to owner
     */
    function withdrawProfits() external onlyOwner {
        uint256 balance = IERC20(WETH).balanceOf(address(this));
        IERC20(WETH).safeTransfer(owner(), balance);
    }
    
    /**
     * @dev Emergency token recovery function
     */
    function rescueTokens(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    /**
     * @dev Batch approve tokens to multiple spenders
     * @param tokens Array of token addresses to approve
     * @param spenders Array of addresses to approve tokens for
     * @param amounts Array of amounts to approve
     */
    function approveTokens(
        address[] calldata tokens,
        address[] calldata spenders,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            tokens.length == spenders.length && tokens.length == amounts.length,
            "Array lengths must match"
        );
        
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).forceApprove(spenders[i], amounts[i]);
        }
    }
}