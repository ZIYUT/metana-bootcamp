# ERC721 NFT Variants

This repository contains implementations of ERC721 NFT contracts with additional features, including integration with OpenSea, minting with ERC20 tokens, and staking functionality. These contracts are built using Solidity and designed to be deployed on gas-efficient networks like Goerli or Polygon.

## Deliverables

1. **NFT Contract Integrated with OpenSea**  
2. **NFT Mintable with ERC20 Tokens**  
3. **NFT Staking for ERC20 Rewards**

---

## Description of Deliverables

### 1. NFT Contract Integrated with OpenSea
A basic ERC721 NFT contract with a collection of 10 unique items, each with traits and associated images, mintable for free and compatible with OpenSea.

#### Key Features
- **Collection Size**: 10 unique NFTs with distinct traits and pictures.
- **Minting**: Free minting, accessible via Etherscan.
- **Network**: Deployed on Goerli or Polygon for gas savings.
- **OpenSea Compatibility**: Follows OpenSea integration standards (e.g., metadata setup per OpenSea tutorials).

#### Notes
- Ensure the contract is verifiable on Etherscan so I can mint the NFTs directly!

---

### 2. NFT Mintable with ERC20 Tokens
A system of three smart contracts enabling NFT minting using a custom ERC20 token.

#### Contracts
1. **ERC20 Token**: A standard ERC20 token with 18 decimal places.
2. **ERC721 Token**: An NFT contract for minting unique tokens.
3. **Minting Contract**: A third contract that accepts ERC20 tokens and mints ERC721 NFTs.

#### Key Features
- **Minting Cost**: 10 ERC20 tokens per NFT.
- **Approval**: Users must approve the minting contract to transfer 10 ERC20 tokens before minting.
- **Decimals**: ERC20 token uses 18 decimal places (standard convention).

#### Implementation Hint
- Use the ERC20 `approve` and `transferFrom` functions to handle token payments securely.

---

### 3. NFT Staking for ERC20 Rewards
A staking system where users can lock their NFTs to earn ERC20 token rewards over time.

#### Contracts
1. **ERC20 Token**: A standard ERC20 token with 18 decimal places, mintable by the staking contract.
2. **ERC721 Token**: An NFT contract for the tokens to be staked.
3. **Staking Contract**: A contract that:
   - Receives ERC721 NFTs from users.
   - Mints and distributes ERC20 token rewards.

#### Key Features
- **Staking Rewards**: Users earn 10 ERC20 tokens every 24 hours per staked NFT.
- **Withdrawal**: Users can withdraw their NFT at any time.
- **Ownership**: The staking contract takes possession of the NFT during staking, but only the original owner can withdraw it.
- **Security**: Prevents re-staking exploits (e.g., resetting the 24-hour timer by re-staking the same NFT).

#### Implementation Notes
- Track staking time per NFT to enforce the 24-hour reward interval.
- Use a mapping or similar structure to ensure only the NFT owner can unstake.

---

## Notes
- All contracts are designed to be deployed on gas-efficient networks (Goerli or Polygon recommended).
- The staking system ensures a classic NFT staking experience with secure reward distribution.
- Beware of edge cases like re-staking or insufficient ERC20 token balances in the staking contract.
