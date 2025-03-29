// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// RestrictedContract: A contract that restricts function calls 
// to Externally Owned Accounts (EOA)
contract RestrictedContract {
    // Function that only allows calls from EOAs, not contracts
    function onlyEOA() view external {
        require(msg.sender == tx.origin, "Only EOA allowed");
        // Additional functionality can be added here
    }
}