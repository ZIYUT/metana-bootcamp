// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myToken is ERC20, Ownable {
    constructor() ERC20("myToken", "TKN") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals()); // Mint 1M tokens to owner
    }
}
