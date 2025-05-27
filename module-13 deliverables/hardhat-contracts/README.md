# Arbitrage Dashboard

An automated arbitrage system that monitors and exploits price discrepancies between decentralized exchanges on the Polygon network.

## Deployed Contracts (Polygon Mainnet)

| Contract | Address | Description |
|----------|---------|-------------|
| PriceLibrary | [0x69001cB0CB2427Fa23E979d39F474f81A9822194](https://polygonscan.com/address/0x69001cB0CB2427Fa23E979d39F474f81A9822194) | Library for price calculations and arbitrage opportunity detection |
| ArbitrageSwapper | [0xdb393Bb33897a067934F2C5753AaC4933981D979](https://polygonscan.com/address/0xdb393Bb33897a067934F2C5753AaC4933981D979) | Contract responsible for executing token swaps between exchanges |
| ArbitrageExecutor | [0x170Bad9cF24704471CA56D9a6155b5f4AC972B7E](https://polygonscan.com/address/0x170Bad9cF24704471CA56D9a6155b5f4AC972B7E) | Main contract that coordinates the arbitrage process using Chainlink Automation |

## Architecture

This project implements a modular approach to DeFi arbitrage:

- **PriceLibrary**: Handles price calculations and detects profitable arbitrage opportunities between exchanges
- **ArbitrageSwapper**: Executes token swaps between different DEXes (Uniswap V3 and SushiSwap)
- **ArbitrageExecutor**: Coordinates the overall arbitrage process using Chainlink Automation and flash loans

## Trading Pairs

The system monitors and executes arbitrage between:
- **Uniswap V3 WETH-USDC Pool** (0.3% fee tier): [0x45dDa9cb7c25131DF268515131f647d726f50608](https://polygonscan.com/address/0x45dDa9cb7c25131DF268515131f647d726f50608)
- **SushiSwap WETH-USDC Pair**: [0x34965ba0ac2451A34a0471F04CCa3F990b8dea27](https://polygonscan.com/address/0x34965ba0ac2451A34a0471F04CCa3F990b8dea27)

## Features

- Monitoring price discrepancies between Uniswap V3 and SushiSwap
- Automatic execution of arbitrage opportunities
- Flash loan integration for capital efficiency
- Chainlink Automation for reliable monitoring
- Modular design for easy maintenance and upgrades

## Development

### Prerequisites

- Node.js v14+ and npm
- Hardhat
- An Infura or Alchemy API key
- A wallet with MATIC for deployment and testing

### Installation

```shell
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

## Testing
```shell
# Run all tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```