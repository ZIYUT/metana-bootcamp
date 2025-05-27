// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/PriceLibrary.sol";
import "../interfaces/ArbitrageInterfaces.sol";

contract TestArbitrageMonitor is AutomationCompatibleInterface, Ownable {
    // 使用您现有的库获取价格
    using PriceLibrary for address;

    // 存储相关地址
    address public uniswapPool;
    address public sushiswapPair;
    
    // 配置参数
    uint256 public minPriceDeviation;  // 100 = 1%
    
    // 监控数据
    uint256 public lastCheckTimestamp;
    uint256 public checkCount;
    uint256 public triggerCount;
    uint256 public lastUniswapPrice;
    uint256 public lastSushiswapPrice;
    uint256 public lastPriceDifference;
    bool public lastTriggerResult;
    
    event OpportunityDetected(
        uint256 uniswapPrice,
        uint256 sushiswapPrice,
        uint256 priceDifference,
        bool wouldExecute
    );
    
    constructor(
        address _uniswapPool,
        address _sushiswapPair,
        uint256 _minPriceDeviation
    ) Ownable(msg.sender) {
        uniswapPool = _uniswapPool;
        sushiswapPair = _sushiswapPair;
        minPriceDeviation = _minPriceDeviation;
    }
    
    // Chainlink Automation 检查函数
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // 获取当前价格
        (uint256 uniswapPrice, uint256 sushiswapPrice) = PriceLibrary.getCurrentPrices(uniswapPool, sushiswapPair);
        
        // 计算价格差异
        (uint256 priceDifference, bool firstHigher) = PriceLibrary.calculatePriceDifference(uniswapPrice, sushiswapPrice);
        
        // 检查是否达到最小差异要求
        upkeepNeeded = priceDifference >= minPriceDeviation;
        
        // 准备执行数据
        performData = abi.encode(uniswapPrice, sushiswapPrice, priceDifference, firstHigher);
        
        return (upkeepNeeded, performData);
    }
    
    // Chainlink Automation 执行函数
    function performUpkeep(bytes calldata performData) external override {
        // 解码执行数据
        (uint256 uniswapPrice, uint256 sushiswapPrice, uint256 priceDifference, bool isFirstHigher) = abi.decode(
            performData,
            (uint256, uint256, uint256, bool)
        );
        
        // 再次验证条件
        bool shouldExecute = priceDifference >= minPriceDeviation;
        
        // 更新状态
        lastCheckTimestamp = block.timestamp;
        checkCount++;
        lastUniswapPrice = uniswapPrice;
        lastSushiswapPrice = sushiswapPrice;
        lastPriceDifference = priceDifference;
        
        // 如果符合条件，记录触发
        if (shouldExecute) {
            triggerCount++;
            lastTriggerResult = true;
            
            // 触发事件，但不执行实际套利
            emit OpportunityDetected(uniswapPrice, sushiswapPrice, priceDifference, true);
        } else {
            lastTriggerResult = false;
        }
    }
    
    // 管理员功能：更新参数
    function updateParameters(uint256 _minPriceDeviation) external onlyOwner {
        minPriceDeviation = _minPriceDeviation;
    }
    
    // 手动触发检查（用于测试）
    function manualCheck() external view returns (bool wouldTrigger, uint256 uniPrice, uint256 sushiPrice, uint256 priceDiff) {
        (uniPrice, sushiPrice) = PriceLibrary.getCurrentPrices(uniswapPool, sushiswapPair);
        (priceDiff, wouldTrigger) = PriceLibrary.calculatePriceDifference(uniPrice, sushiPrice);
        return (wouldTrigger, uniPrice, sushiPrice, priceDiff);
    }

    function checkArbitrageOpportunity() external view returns (
        bool isProfitable,
        uint256 estimatedProfit,
        uint256 priceDiff,
        bool firstHigher
    ) {
        (uint256 uniswapPrice, uint256 sushiswapPrice) = PriceLibrary.getCurrentPrices(
            uniswapPool,
            sushiswapPair
        );
        
        (priceDiff, firstHigher) = PriceLibrary.calculatePriceDifference(
            uniswapPrice,
            sushiswapPrice
        );
        
        (isProfitable, estimatedProfit) = PriceLibrary.isProfitableArbitrage(
            priceDiff,
            50, // minDeviation (0.5%)
            30 gwei, // gasPrice
            300000 // estimatedGasUsed
        );
    }
}