// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract RestrictedContract {
    function onlyEOA() view external {
        require(msg.sender == tx.origin, "Only EOA allowed");
    }
}