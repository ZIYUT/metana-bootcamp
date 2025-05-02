# ETH Crypto Wallet Implementation

This project implements a basic Ethereum wallet from scratch without using existing wallet libraries. It demonstrates direct interaction with the Ethereum blockchain by manually handling account nonce, gas estimation, and raw transaction creation.

## Overview

This wallet implementation allows users to transfer ETH from a smart contract to any recipient address. The wallet uses a two-component architecture:

1. **Smart Contract** (`CryptoWallet.sol`): Stores ETH and provides controlled access to funds
2. **Client Application** (`wallet.js`): Interacts with the blockchain to create and submit transactions

The deployed contract can be viewed at: [0x343682F7785E5309a3B59f513fB2F5639b7eE4A7](https://sepolia.etherscan.io/address/0x343682F7785E5309a3B59f513fB2F5639b7eE4A7#code)

## Features

- **Manual nonce management**: Retrieves and manages the account nonce without using wallet libraries
- **Gas estimation**: Manually estimates gas required for transactions via RPC calls
- **Raw transaction creation**: Constructs, signs and serializes raw transactions
- **Transaction broadcasting**: Manually broadcasts signed transactions to the network
- **Interactive CLI**: User-friendly command-line interface for transaction parameters

## Core Components Implemented

- **Account Nonce Management**: Custom implementation to track and manage transaction nonces
- **Gas Estimation**: Manual gas calculation using RPC calls without wallet abstractions
- **Raw Transaction Creation**: Direct construction and signing of Ethereum transactions
- **Smart Contract Integration**: Interaction with a custom ETH wallet contract

## Smart Contract

The `CryptoWallet.sol` contract provides:

- ETH storage capability
- Owner-based access control
- ETH transfer functionality
- Balance checking

## Setup and Usage

### Prerequisites
- Node.js and npm installed
- Sepolia testnet ETH (available from faucets)

### Installation
1. Clone the repository
2. Install dependencies:

```
npm install dotenv axios @noble/hashes ethereumjs-tx ethereumjs-common
```

### Deployment
1. Deploy the `CryptoWallet.sol` contract to Sepolia testnet
2. Fund the contract with test ETH
3. Update the `.env` file with the deployed contract address

### Running the Wallet
```
node wallet.js
```
Follow the prompts to specify:
- Recipient address
- ETH amount to transfer

## Security Notice

- This implementation is for educational purposes only
- Only use throwaway private keys for testing
- Only test on testnets, never on mainnet
- The .env file contains sensitive information and should be included in .gitignore

## Technical Implementation Details

The wallet implements the entire transaction lifecycle:
1. **Account nonce retrieval** via `eth_getTransactionCount` RPC method
2. **Gas price retrieval** via `eth_gasPrice` RPC method
3. **Function parameter encoding** for smart contract interaction
4. **Raw transaction construction** including all required fields
5. **Transaction signing** using the private key
6. **Transaction serialization** to hex format
7. **Transaction broadcasting** via `eth_sendRawTransaction` RPC method

All of these steps are implemented manually without relying on wallet libraries like ethers.js or web3.js.Follow the prompts to specify:
- Recipient address
- ETH amount to transfer

## Security Notice

- This implementation is for educational purposes only
- Only use throwaway private keys for testing
- Only test on testnets, never on mainnet
- The .env file contains sensitive information and should be included in .gitignore

## Technical Implementation Details

The wallet implements the entire transaction lifecycle:
1. **Account nonce retrieval** via `eth_getTransactionCount` RPC method
2. **Gas price retrieval** via `eth_gasPrice` RPC method
3. **Function parameter encoding** for smart contract interaction
4. **Raw transaction construction** including all required fields
5. **Transaction signing** using the private key
6. **Transaction serialization** to hex format
7. **Transaction broadcasting** via `eth_sendRawTransaction` RPC method

All of these steps are implemented manually without relying on wallet libraries like ethers.js or web3.js.
