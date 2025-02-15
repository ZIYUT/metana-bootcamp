// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Token is ERC1155, Ownable {
    mapping(address => uint256) public lastMintTime;

    constructor() ERC1155("https://api.example.com/api/token/{id}.json") Ownable(msg.sender) {}

    // Mint function for tokens 0, 1, and 2
    function mint(uint256 id, uint256 amount) external onlyOwner {
        require(id <= 6, "Invalid token ID"); // Only ID 0-6
        _mint(msg.sender, id, amount, "");
    }

    // Burn function for tokens 3 to 6
    function burn(uint256 id, uint256 amount) external {
        require(id >= 3 && id <= 6, "Cannot burn this token");
        _burn(msg.sender, id, amount);
    }
}