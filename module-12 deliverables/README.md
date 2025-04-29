# Damn Vulnerable DeFi Challenge Solutions

This repository contains solutions to two challenges from the Damn Vulnerable DeFi project:

## Challenges

- [Free Rider](./free-rider) - Solution containing test contract and attacker implementation for the Free Rider challenge.

- [Selfie](./selfie) - Solution containing test contract for the Selfie challenge.

Each folder contains the required smart contract test files to demonstrate successful exploitation of the vulnerabilities.

## Challenge Details

### Free Rider


# Free Rider Challenge

This solution demonstrates how to exploit the vulnerability in the Free Rider challenge from Damn Vulnerable DeFi.

The attack involves manipulating NFT marketplace pricing and flash loans to purchase valuable NFTs at a fraction of their worth.

Key components:
- Flash loan from Uniswap/WETH
- Exploitation of pricing bug in NFT marketplace
- Proper handling of ERC721 callbacks

Test files show the complete attack flow.


### Selfie


# Selfie Challenge

This solution demonstrates how to exploit the Selfie challenge from Damn Vulnerable DeFi.

The attack targets the governance mechanism of the DamnValuableTokenSnapshot and SelfiePool contracts.

Key components:
- Snapshot functionality exploitation
- Governance delay manipulation
- Draining funds through governance proposals

Test files contain the complete solution demonstrating the vulnerability.
