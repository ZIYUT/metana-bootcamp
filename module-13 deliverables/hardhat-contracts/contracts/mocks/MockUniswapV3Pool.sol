// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ArbitrageInterfaces.sol";

contract MockUniswapV3Pool is IUniswapV3Pool {
    uint160 private sqrtPriceX96;
    
    function setPrice(uint256 price) external {
        // price = (sqrtPriceX96^2 * 1e6) / 2^192
        // sqrtPriceX96 = sqrt(price * 2^192 / 1e6)
        sqrtPriceX96 = uint160(sqrt(price * (1 << 192) / 1e6));
    }
    
    function slot0() external view override returns (
        uint160 sqrtPriceX96_,
        int24 tick,
        uint16 observationIndex,
        uint16 observationCardinality,
        uint16 observationCardinalityNext,
        uint8 feeProtocol,
        bool unlocked
    ) {
        return (sqrtPriceX96, 0, 0, 0, 0, 0, true);
    }
    
    function sqrt(uint256 x) internal pure returns (uint160) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return uint160(y);
    }
    
    // Implement other required interface functions with empty implementations
    function token0() external pure override returns (address) { return address(0); }
    function token1() external pure override returns (address) { return address(0); }
    function fee() external pure override returns (uint24) { return 0; }
    function tickSpacing() external pure override returns (int24) { return 0; }
    function maxLiquidityPerTick() external pure override returns (uint128) { return 0; }
    function liquidity() external pure override returns (uint128) { return 0; }
    function ticks(int24) external pure override returns (uint128, int128, uint256, uint256, int56, uint160, uint32, bool) { return (0, 0, 0, 0, 0, 0, 0, false); }
    function tickBitmap(int16) external pure override returns (uint256) { return 0; }
    function observations(uint256) external pure override returns (uint32, int56, uint160, bool) { return (0, 0, 0, false); }
    function snapshotCumulativesInside(int24, int24) external pure override returns (int56, uint160, uint32) { return (0, 0, 0); }
    function observe(uint32[] calldata) external pure override returns (int56[] memory, uint160[] memory) { return (new int56[](0), new uint160[](0)); }
    function increaseObservationCardinalityNext(uint16) external override {}
    function initialize(uint160) external override {}
    function mint(address, int24, int24, uint128, bytes calldata) external override returns (uint256, uint256) { return (0, 0); }
    function collect(address, int24, int24, uint128, uint128) external override returns (uint128, uint128) { return (0, 0); }
    function burn(int24, int24, uint128) external override returns (uint256, uint256) { return (0, 0); }
    function swap(address, bool, int256, uint160, bytes calldata) external override returns (int256, int256) { return (0, 0); }
    function flash(address, uint256, uint256, bytes calldata) external override {}
    function setFeeProtocol(uint8, uint8) external override {}
    function collectProtocol(address, uint128, uint128) external override returns (uint128, uint128) { return (0, 0); }
} 