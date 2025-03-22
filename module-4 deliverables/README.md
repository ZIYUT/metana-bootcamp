# Code Cleanup and Testing

This repository contains the deliverables for Module 4, focusing on cleaning up previous Solidity codebases, adding unit tests, and performing advanced testing techniques like mutation testing. Below are the details of the tasks completed.

## Deliverables

1. **Old Code Cleanup**
2. **Unit Tests for Partial Refund (Module 1) and Forging Dapp (Module 3)**
3. **Coverage and Mutation Testing**

---

## Description of Deliverables

### 1. Old Code Cleanup
- **Tools Used**:
  - **Solhint**: Linted all Solidity files from previous assignments to enforce coding standards.
  - **Prettier**: Formatted the code for consistency and readability.
- **Adjustments**:
  - Modified the maximum line length in Prettier configuration if the default formatting appeared awkward.
- **Slither Analysis**:
  - Ran Slither on the final versions of all previous assignments (Modules 1-3).
  - Reviewed findings to determine if reported issues were legitimate errors or false positives.

### 2. Unit Tests
Unit tests were added to two previous assignments:
- **Partial Refund Assignment (Module 1)**:
  - Tested the ERC20 token with partial refund functionality.
  - Covered key functions like `sellBack(uint256 amount)`, token minting, Ether withdrawal, and edge cases (e.g., insufficient Ether in the contract).
- **Forging Dapp (Module 3)**:
  - Tested the ERC1155 token contract and forging logic contract.
  - Included tests for minting tokens `[0-2]` with cooldowns, forging tokens `[3-6]`, trading functionality, and burning mechanics.

### 3. Coverage and Mutation Testing
- **Coverage Goals**:
  - One assignment (either Partial Refund or Forging Dapp) achieved **100% line and branch coverage**.
  - The other assignment achieved at least **90% line and branch coverage**.
- **Mutation Testing**:
  - Performed on the assignment with 100% coverage.
  - Analyzed results to identify any faulty or insufficient tests (e.g., tests that passed despite code mutations).

---

## Notes
- **Slither Findings**: Any errors or warnings from Slither were documented, with explanations of whether they were addressed or deemed false positives.
- **Coverage Tools**: Used tools like Hardhat or Truffle with coverage plugins to measure line and branch coverage.
- **Mutation Testing Insights**: If faulty tests were discovered, they are noted along with steps taken to improve them.

---

Explore the cleaned-up code, test suites, and analysis results in this repository! Contributions or suggestions for further improvements are welcome.
