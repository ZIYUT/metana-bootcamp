# Module-8 deliverables

This repository contains my implementation of two Solidity-based assignments: **Address Hacks** and **Advanced NFT**. These projects showcase smart contract development techniques, security practices, and gas optimization using OpenZeppelin's libraries.

## Assignments Overview

### 1. Address Hacks
In this assignment, I explored vulnerabilities related to address checks in Solidity and demonstrated secure practices using OpenZeppelin's `Address` library.

- Created a set of simple smart contracts to show how `extcodesize` can be bypassed during a contract's constructor phase, allowing a contract to appear as an externally owned account (EOA).
- Demonstrated that using `msg.sender == tx.origin` prevents calls from a constructor, as `tx.origin` remains the original caller while `msg.sender` could be a contract.
- Integrated OpenZeppelin's `Address` library to handle address-related operations safely and mitigate the `extcodesize` bypass issue.

### 2. Advanced NFT
For this assignment, I built an advanced ERC-721 NFT contract with features like airdrops, random allocation, batch transfers, and state management.

- **Merkle Tree Airdrop**: 
  - Implemented a Merkle tree to whitelist addresses for a one-time NFT mint.
  - Compared gas costs between using a `mapping` and a bitmap (from OpenZeppelin's `BitMaps`) to track minted addresses. The Merkle leaf is the hash of an address and its bitmap index.
- **Commit-Reveal for Random NFT IDs**: 
  - Added a commit-reveal mechanism to assign NFT IDs randomly. Users commit a hash, and the reveal happens 10 blocks later, ensuring fairness without relying on external oracles like Chainlink.
- **Multicall**: 
  - Included multicall functionality to allow transferring multiple NFTs in one transaction, with checks to prevent minting abuse.
- **State Machine**: 
  - Designed a state machine to manage sale phases: Minting Disabled, Presale, Public Sale, and Sold Out. All `require` statements for state transitions depend only on the current state (except for input validation).
- **Fund Withdrawal**: 
  - Enabled a designated address to withdraw funds using the pull payment pattern, supporting distribution to an arbitrary number of contributors.

## Notes
- The contracts prioritize security and gas efficiency.
- Tests verify the functionality of the Merkle tree, commit-reveal, multicall, and state transitions.
- OpenZeppelin libraries (`Address`, `BitMaps`, and ERC-721 utilities) were used to enhance reliability and efficiency.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
