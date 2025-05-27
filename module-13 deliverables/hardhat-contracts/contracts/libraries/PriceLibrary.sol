// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ArbitrageInterfaces.sol";

/**
 * @title PriceLibrary
 * @dev Library for price calculations and arbitrage opportunity detection
 * Contains functions to get prices from different exchanges and calculate optimal loan amounts
 */
library PriceLibrary {
    // Constants
    address public constant WETH = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619; // Polygon WETH
    address public constant USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174; // Polygon USDC
    uint24 public constant UNISWAP_FEE = 3000; // 0.3% fee tier
    uint256 private constant PRECISION = 1e6; // 6 decimal places for percentage calculations
    
    /**
     * @dev Get current prices from both DEXes
     * @param uniswapPool Address of Uniswap V3 pool
     * @param sushiswapPair Address of SushiSwap pair
     * @return uniswapPrice Price from Uniswap
     * @return sushiswapPrice Price from SushiSwap
     */
    function getCurrentPrices(
        address uniswapPool,
        address sushiswapPair
    ) external view returns (uint256 uniswapPrice, uint256 sushiswapPrice) {
        // Get Uniswap price
        (uint160 sqrtPriceX96,,,,,,) = IUniswapV3Pool(uniswapPool).slot0();
        uniswapPrice = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * 1e6 / (1 << 192);
        
        // Get SushiSwap price
        (uint112 reserve0, uint112 reserve1,) = ISushiswapPair(sushiswapPair).getReserves();
        sushiswapPrice = (uint256(reserve1) * 1e6) / uint256(reserve0);
    }
    
    /**
     * @dev Calculate price difference between two prices
     * @param price1 First price
     * @param price2 Second price
     * @return priceDiff Price difference in basis points
     * @return firstHigher Whether first price is higher
     */
    function calculatePriceDifference(
        uint256 price1,
        uint256 price2
    ) public pure returns (uint256 priceDiff, bool firstHigher) {
        if (price1 == 0 || price2 == 0) {
            return (0, false);
        }
        
        firstHigher = price1 > price2;
        uint256 higherPrice = firstHigher ? price1 : price2;
        uint256 lowerPrice = firstHigher ? price2 : price1;
        
        // Calculate percentage difference in basis points (1 basis point = 0.01%)
        // Use PRECISION to avoid overflow
        priceDiff = ((higherPrice - lowerPrice) * 10000 * PRECISION) / (lowerPrice * PRECISION);
    }
    
    /**
     * @dev Check if arbitrage is profitable considering gas costs
     * @param priceDiff Price difference in basis points
     * @param minDeviation Minimum required deviation in basis points
     * @param gasPrice Current gas price in wei
     * @param estimatedGasUsed Estimated gas usage for the arbitrage
     * @return isProfitable Whether the arbitrage is profitable
     * @return estimatedProfit Estimated profit in wei
     */
    function isProfitableArbitrage(
        uint256 priceDiff,
        uint256 minDeviation,
        uint256 gasPrice,
        uint256 estimatedGasUsed
    ) public pure returns (bool isProfitable, uint256 estimatedProfit) {
        if (priceDiff < minDeviation) {
            return (false, 0);
        }
        
        uint256 gasCost = gasPrice * estimatedGasUsed;
        estimatedProfit = (priceDiff * 1e18) / 10000; // Convert basis points to wei
        
        isProfitable = estimatedProfit > gasCost;
        if (!isProfitable) {
            estimatedProfit = 0;
        }
    }
    
    /**
     * @dev Calculate optimal loan amount based on price difference
     * @param priceDiff Price difference in basis points
     * @return loanAmount Optimal loan amount in wei
     */
    function calculateOptimalLoanAmount(
        uint256 priceDiff
    ) public pure returns (uint256 loanAmount) {
        // Simple calculation: more price difference = larger loan
        // This is a simplified version - in production, you'd want more sophisticated calculations
        loanAmount = (priceDiff * 1e18) / 100; // Convert basis points to wei
    }
}