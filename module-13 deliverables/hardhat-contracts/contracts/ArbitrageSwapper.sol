// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ArbitrageInterfaces.sol";

/**
 * @title ArbitrageSwapper
 * @dev Contract responsible for executing token swaps between different exchanges
 * Handles the actual swap operations for arbitrage opportunities
 */
contract ArbitrageSwapper {
    using SafeERC20 for IERC20;
    
    // Constants
    address public immutable WETH;
    address public immutable USDC;
    
    // Events
    event SwapExecuted(
        address indexed fromToken,
        address indexed toToken,
        address indexed exchange,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event ArbitrageExecuted(
        address indexed fromExchange,
        address indexed toExchange,
        uint256 startAmount,
        uint256 endAmount,
        uint256 profit
    );
    
    /**
     * @dev Constructor
     * @param _weth Address of WETH token
     * @param _usdc Address of USDC token
     */
    constructor(address _weth, address _usdc) {
        WETH = _weth;
        USDC = _usdc;
    }
    
    /**
     * @dev Execute a swap from Uniswap to Sushiswap
     * @param uniswapRouter Uniswap V3 router address
     * @param sushiswapRouter Sushiswap router address
     * @param fee Uniswap V3 pool fee
     * @param amountIn Amount of tokens to swap
     * @return finalAmount Final amount of tokens received after arbitrage
     */
    function executeUniswapToSushiswapArbitrage(
        address uniswapRouter, 
        address sushiswapRouter, 
        uint24 fee,
        uint256 amountIn
    ) external returns (uint256 finalAmount) {
        // Step 1: Ensure we have approval to spend tokens
        IERC20(WETH).forceApprove(uniswapRouter, amountIn);
        
        // Step 2: Execute swap on Uniswap V3
        uint256 uniswapAmountOut = _swapOnUniswap(
            uniswapRouter,
            WETH,
            USDC,
            fee,
            amountIn,
            0  // No minimum output enforced here
        );
        
        // Step 3: Execute swap on Sushiswap
        IERC20(USDC).forceApprove(sushiswapRouter, uniswapAmountOut);
        uint256 sushiswapAmountOut = _swapOnSushiswap(
            sushiswapRouter,
            USDC,
            WETH,
            uniswapAmountOut,
            0  // No minimum output enforced here
        );
        
        // Calculate profit
        uint256 profit = 0;
        if (sushiswapAmountOut > amountIn) {
            profit = sushiswapAmountOut - amountIn;
        }
        
        // Emit event for the full arbitrage
        emit ArbitrageExecuted(
            uniswapRouter,
            sushiswapRouter,
            amountIn,
            sushiswapAmountOut,
            profit
        );
        
        return sushiswapAmountOut;
    }
    
    /**
     * @dev Execute a swap from Sushiswap to Uniswap
     * @param uniswapRouter Uniswap V3 router address
     * @param sushiswapRouter Sushiswap router address
     * @param fee Uniswap V3 pool fee
     * @param amountIn Amount of tokens to swap
     * @return finalAmount Final amount of tokens received after arbitrage
     */
    function executeSushiswapToUniswapArbitrage(
        address uniswapRouter, 
        address sushiswapRouter, 
        uint24 fee,
        uint256 amountIn
    ) external returns (uint256 finalAmount) {
        // Step 1: Ensure we have approval to spend tokens
        IERC20(WETH).forceApprove(sushiswapRouter, amountIn);
        
        // Step 2: Execute swap on Sushiswap
        uint256 sushiswapAmountOut = _swapOnSushiswap(
            sushiswapRouter,
            WETH,
            USDC,
            amountIn,
            0  // No minimum output enforced here
        );
        
        // Step 3: Execute swap on Uniswap V3
        IERC20(USDC).forceApprove(uniswapRouter, sushiswapAmountOut);
        uint256 uniswapAmountOut = _swapOnUniswap(
            uniswapRouter,
            USDC,
            WETH,
            fee,
            sushiswapAmountOut,
            0  // No minimum output enforced here
        );
        
        // Calculate profit
        uint256 profit = 0;
        if (uniswapAmountOut > amountIn) {
            profit = uniswapAmountOut - amountIn;
        }
        
        // Emit event for the full arbitrage
        emit ArbitrageExecuted(
            sushiswapRouter,
            uniswapRouter,
            amountIn,
            uniswapAmountOut,
            profit
        );
        
        return uniswapAmountOut;
    }
    
    /**
     * @dev Internal function to execute a swap on Uniswap V3
     * @param router Uniswap V3 router address
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param fee Pool fee tier
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens expected
     * @return amountOut Amount of output tokens received
     */
    function _swapOnUniswap(
        address router,
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal returns (uint256 amountOut) {
        // Create swap parameters
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: address(this),
            deadline: block.timestamp + 300, // 5 minutes from now
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });
        
        // Execute swap
        amountOut = IUniswapV3Router(router).exactInputSingle(params);
        
        // Emit event
        emit SwapExecuted(
            tokenIn,
            tokenOut,
            router,
            amountIn,
            amountOut
        );
        
        return amountOut;
    }
    
    /**
     * @dev Internal function to execute a swap on Sushiswap
     * @param router Sushiswap router address
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens expected
     * @return amountOut Amount of output tokens received
     */
    function _swapOnSushiswap(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal returns (uint256 amountOut) {
        // Create path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        // Execute swap
        uint[] memory amounts = ISushiswapRouter(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 // 5 minutes from now
        );
        
        // Get output amount (last element in amounts array)
        amountOut = amounts[amounts.length - 1];
        
        // Emit event
        emit SwapExecuted(
            tokenIn,
            tokenOut,
            router,
            amountIn,
            amountOut
        );
        
        return amountOut;
    }
}