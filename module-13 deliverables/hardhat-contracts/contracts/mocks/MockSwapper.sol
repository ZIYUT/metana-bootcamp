// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockSwapper {
    function executeUniswapToSushiswapArbitrage(
        address,
        address,
        uint24,
        uint256 amountIn
    ) external pure returns (uint256) {
        // Mock implementation - return 1% profit
        return amountIn + (amountIn / 100);
    }

    function executeSushiswapToUniswapArbitrage(
        address,
        address,
        uint24,
        uint256 amountIn
    ) external pure returns (uint256) {
        // Mock implementation - return 1% profit
        return amountIn + (amountIn / 100);
    }
} 