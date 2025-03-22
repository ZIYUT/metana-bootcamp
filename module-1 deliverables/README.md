# ERC20 Token Variants

This repository contains implementations of ERC20 token variants built by extending the [OpenZeppelin ERC20 implementation](https://github.com/OpenZeppelin/openzeppelin-contracts). Each variant introduces unique functionality as outlined below. These contracts are written in Solidity and leverage OpenZeppelin's robust and secure base contracts.

## Deliverables

1. **ERC20 with God-Mode**  
2. **ERC20 with Sanctions**  
3. **ERC20 with Token Sale**  
4. **ERC20 with Token Sale and Partial Refunds**

---

## Description of Deliverables

All implementations extend the OpenZeppelin ERC20 contract. Some internal functions may be overridden to achieve the required functionality. For reference, check out:
- [OpenZeppelin Contracts Documentation](https://docs.openzeppelin.com/contracts/)
- [OpenZeppelin GitHub Repository](https://github.com/OpenZeppelin/openzeppelin-contracts)

### 1. ERC20 with God-Mode
A special "god-mode" address has unrestricted control over the token, enabling it to:
- **Steal funds** from other addresses.
- **Create tokens** at will.
- **Destroy tokens** as needed.

#### Key Functions
- `mintTokensToAddress(address recipient)`: Mints tokens to a specified address.
- `changeBalanceAtAddress(address target)`: Modifies the balance of a target address.
- `authoritativeTransferFrom(address from, address to)`: Transfers tokens from one address to another without approval.

---

### 2. ERC20 with Sanctions
A centralized authority can blacklist addresses, preventing them from sending or receiving tokens.

#### Implementation Notes
- **Data Structure**: Use an appropriate structure (e.g., mapping) to store the blacklist.
- **Access Control**: Only the centralized authority can modify the blacklist.
- **Reference**: Study the `_update` function in [OpenZeppelin's ERC20.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/05f218fb6617932e56bf5388c3b389c3028a7b73/contracts/token/ERC20/ERC20.sol#L183) for inspiration.

---

### 3. ERC20 with Token Sale
Users can mint tokens by paying Ether, with the following specifications:
- **Minting Rate**: 1 Ether = 1,000 tokens.
- **Decimals**: Tokens have 18 decimal places (common for ERC20 tokens, unlike USDC with 6 or WBTC with 8).
- **Total Supply Cap**: 1,000,000 tokens. The sale stops once this limit is reached.
- **Withdrawal**: Includes a function to withdraw accumulated Ether from the contract to the deployer's address.

---

### 4. ERC20 with Token Sale and Partial Refunds
Extends the Token Sale contract with a refund mechanism:
- **Refund Rate**: Users can sell back tokens at 0.5 Ether per 1,000 tokens.
- **Flexible Amounts**: Accepts any amount via the `sellBack(uint256 amount)` function.
- **Approval**: Users must approve the contract to withdraw their tokens (see [ERC20.sol#L136](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/49f218fb6617932e56bf5388c3b389c3028a3091e33ee2/contracts/token/ERC20/ERC20.sol#L136)).
- **Safety Checks**:
  - Blocks transactions if the contract lacks sufficient Ether for refunds.
  - Fails minting attempts if the total supply cap (1,000,000 tokens) is reached and no tokens are held by the contract.
- **Integer Division**: Handles division carefully to avoid precision issues.

#### Key Function
- `sellBack(uint256 amount)`: Allows users to sell tokens back to the contract for Ether.

---

## Notes
- Users can buy and sell tokens freely, but they lose Ether over time due to the refund rate being lower than the purchase rate.
- The maximum supply remains capped at 1,000,000 tokens under all conditions.

