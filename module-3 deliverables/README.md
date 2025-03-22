# ERC1155 Token Minting and Forging Website

This repository contains an ERC1155 token contract and a front-end web application that allows users to mint tokens, "forge" new ones by burning existing tokens, and interact with the Polygon network via MetaMask. The project emphasizes both smart contract development and front-end design.

## Deliverables

- **A Website for Minting and Forging ERC1155 Tokens**

---

## Description of Deliverables

### Overview
The goal is to create an ERC1155 token collection integrated with a user-friendly web app. The focus is on front-end development (styling and user experience) and blockchain interaction via MetaMask. Key concepts include:
- **Instant Transactions**: Handling view/pure functions that return data instantly.
- **Asynchronous Transactions**: Managing state-changing transactions (e.g., minting, burning) with pending states.
- **Network Switching**: Prompting users to switch to the Polygon network with pre-filled network details.

### Requirements

#### ERC1155 Token Collection
- **Token IDs**: 7 tokens with IDs `[0-6]`.
- **Supply**: No supply limit for any token.
- **Minting Rules**:
  - Tokens `[0-2]`: Anyone can mint for free (gas cost only), with a 1-minute cooldown between mints.
  - Token `3`: Minted by burning tokens `0` and `1`.
  - Token `4`: Minted by burning tokens `1` and `2`.
  - Token `5`: Minted by burning tokens `0` and `2`.
  - Token `6`: Minted by burning tokens `0`, `1`, and `2`.
- **Forging**: The process of burning tokens to mint new ones (e.g., burn `0` and `1` to mint `3`).
- **Restrictions**:
  - Tokens `[3-6]` cannot be forged into other tokens.
  - Tokens `[3-6]` can be burned, but no rewards are given.
- **Trading**: Users can trade any token for tokens `[0-2]` via a "Trade This" button.

#### Web Application
- **Network**: Built for the Polygon network (Matic) for cost savings.
- **User Information**:
  - Displays the user’s Matic balance.
  - Shows the user’s balance for each token `[0-6]`.
- **Network Detection**: If the user is not on Polygon, prompt them to switch and auto-fill network details (e.g., chain ID, RPC URL).
- **OpenSea Integration**: Includes a link to the collection’s OpenSea page.
---

## Implementation Notes
- **MetaMask Integration**: Handles both instant queries (e.g., balance checks) and asynchronous transactions (e.g., minting, forging).
- **Cooldown Logic**: Enforce a 1-minute cooldown for minting tokens `[0-2]` using timestamps.
- **Forging Mechanics**: The forging contract must burn the required tokens and mint the new ones in a single transaction.
- **Security**: Ensure only the forging contract has minting privileges for the ERC1155 tokens.

---

## Why This Matters
This project demonstrates proficiency in:
- Solidity smart contract development (ERC1155 standard).
- Front-end development with blockchain integration.
- User experience design with real-time blockchain interactions.
