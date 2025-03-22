# Real-Time Blockchain Analytics Dashboard

This project is a front-end application that visualizes real-time Ethereum blockchain metrics. Built with a React-based framework (Next.js recommended), it displays key data from the latest 10 blocks and updates dynamically as new blocks are produced on the Ethereum network.

## Project Overview

The dashboard provides a real-time view of blockchain activity through three interactive charts, leveraging Ethereum's block data and ERC20 token transactions. It connects to the Ethereum network, listens for new blocks, and updates visualizations seamlessly.

## Requirements

### 1. Initial Setup
- **On Page Load**: Displays data from the most recent 10 blocks.
- **Real-Time Updates**: Graphs shift with each new block, always showing the latest 10 blocks.

### 2. Real-Time Graphs
- **First Chart: ERC20 Token Transfer Volume**
  - Tracks the total transfer volume of a chosen ERC20 token (e.g., USDC, DAI, or another popular token).
  - Plots the total token transfer volume per block (0 if no transfers occur).
  - Tested with popular ERC20 tokens to ensure sufficient data for visualization.
- **Second Chart: BASEFEE per Block**
  - Displays the BASEFEE for each block (refer to [EIP-1559 Gas Savings](https://eips.ethereum.org/EIPS/eip-1559) for context).
  - X-axis: Block number; Y-axis: BASEFEE (in wei or gwei, as appropriate).
- **Third Chart: Gas Used vs. Gas Limit Ratio**
  - Plots the ratio of `gasUsed` to `gasLimit` as a percentage for each block.
  - Highlights the relationship between this ratio and BASEFEE trends.

### 3. Real-Time Block Listening
- Actively listens for new blocks using an Ethereum node provider (e.g., Infura, Alchemy).
- Updates all charts in real-time, shifting the data window to the latest 10 blocks as new blocks arrive.

## Tech Stack
- **Framework**: React-based (Next.js recommended for server-side rendering and routing).
- **Blockchain Data**: Ethereum mainnet via a Web3 provider (e.g., Web3.js, Ethers.js).
- **Charting Library**: Options like Chart.js, Recharts, or D3.js for visualizations.
