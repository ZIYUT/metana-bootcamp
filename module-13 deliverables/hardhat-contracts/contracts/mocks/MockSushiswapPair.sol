// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ArbitrageInterfaces.sol";

contract MockSushiswapPair is ISushiswapPair {
    uint112 private reserve0;
    uint112 private reserve1;
    
    function setPrice(uint256 price) external {
        // Set reserves to create the desired price
        // price = reserve1/reserve0
        reserve0 = 1e6; // Base reserve
        reserve1 = uint112(price); // Price * base reserve
    }
    
    function getReserves() external view returns (
        uint112 _reserve0,
        uint112 _reserve1,
        uint32 _blockTimestampLast
    ) {
        return (reserve0, reserve1, uint32(block.timestamp));
    }
    
    // Implement other required interface functions with empty implementations
    function name() external view returns (string memory) { return ""; }
    function symbol() external view returns (string memory) { return ""; }
    function decimals() external view returns (uint8) { return 0; }
    function totalSupply() external view returns (uint256) { return 0; }
    function balanceOf(address) external view returns (uint256) { return 0; }
    function allowance(address, address) external view returns (uint256) { return 0; }
    function approve(address, uint256) external returns (bool) { return false; }
    function transfer(address, uint256) external returns (bool) { return false; }
    function transferFrom(address, address, uint256) external returns (bool) { return false; }
    function DOMAIN_SEPARATOR() external view returns (bytes32) { return bytes32(0); }
    function PERMIT_TYPEHASH() external view returns (bytes32) { return bytes32(0); }
    function nonces(address) external view returns (uint256) { return 0; }
    function permit(address, address, uint256, uint256, uint8, bytes32, bytes32) external {}
    function MINIMUM_LIQUIDITY() external pure returns (uint256) { return 0; }
    function factory() external view returns (address) { return address(0); }
    function token0() external view returns (address) { return address(0); }
    function token1() external view returns (address) { return address(0); }
    function price0CumulativeLast() external view returns (uint256) { return 0; }
    function price1CumulativeLast() external view returns (uint256) { return 0; }
    function kLast() external view returns (uint256) { return 0; }
    function mint(address) external returns (uint256) { return 0; }
    function burn(address) external returns (uint256, uint256) { return (0, 0); }
    function swap(uint256, uint256, address, bytes calldata) external {}
    function skim(address) external {}
    function sync() external {}
    function initialize(address, address) external {}
} 