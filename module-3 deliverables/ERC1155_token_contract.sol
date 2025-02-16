// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Token is ERC1155, Ownable {
    mapping(address => uint256) public lastMintTime; // 记录冷却时间

    constructor() ERC1155("https://api.example.com/api/token/{id}.json") Ownable(msg.sender) {}

    // Mint function for token 0 (with cooldown)
    function mintToken0() external {
        require(block.timestamp >= lastMintTime[msg.sender] + 3 seconds, "Cooldown: Try again in 3 seconds");
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, 0, 1, ""); // Mint 1 token of type 0
    }

    // Mint function for token 1 (with cooldown)
    function mintToken1() external {
        require(block.timestamp >= lastMintTime[msg.sender] + 3 seconds, "Cooldown: Try again in 3 seconds");
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, 1, 1, ""); // Mint 1 token of type 1
    }

    // Mint function for token 2 (with cooldown)
    function mintToken2() external {
        require(block.timestamp >= lastMintTime[msg.sender] + 3 seconds, "Cooldown: Try again in 3 seconds");
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, 2, 1, ""); // Mint 1 token of type 2
    }

    // Mint token 3 by burning token 0 and 1
    function mintToken3() external {
        require(balanceOf(msg.sender, 0) >= 1, "Insufficient token 0 to mint token 3");
        require(balanceOf(msg.sender, 1) >= 1, "Insufficient token 1 to mint token 3");

        // Burn token 0 and 1
        _burn(msg.sender, 0, 1);
        _burn(msg.sender, 1, 1);

        // Mint token 3
        _mint(msg.sender, 3, 1, ""); // Mint 1 token of type 3
    }

    // Mint token 4 by burning token 1 and 2
    function mintToken4() external {
        require(balanceOf(msg.sender, 1) >= 1, "Insufficient token 1 to mint token 4");
        require(balanceOf(msg.sender, 2) >= 1, "Insufficient token 2 to mint token 4");

        // Burn token 1 and 2
        _burn(msg.sender, 1, 1);
        _burn(msg.sender, 2, 1);

        // Mint token 4
        _mint(msg.sender, 4, 1, ""); // Mint 1 token of type 4
    }

    // Mint token 5 by burning token 0 and 2
    function mintToken5() external {
        require(balanceOf(msg.sender, 0) >= 1, "Insufficient token 0 to mint token 5");
        require(balanceOf(msg.sender, 2) >= 1, "Insufficient token 2 to mint token 5");

        // Burn token 0 and 2
        _burn(msg.sender, 0, 1);
        _burn(msg.sender, 2, 1);

        // Mint token 5
        _mint(msg.sender, 5, 1, ""); // Mint 1 token of type 5
    }

    // Mint token 6 by burning token 0, 1, and 2
    function mintToken6() external {
        require(balanceOf(msg.sender, 0) >= 1, "Insufficient token 0 to mint token 6");
        require(balanceOf(msg.sender, 1) >= 1, "Insufficient token 1 to mint token 6");
        require(balanceOf(msg.sender, 2) >= 1, "Insufficient token 2 to mint token 6");

        // Burn token 0, 1, and 2
        _burn(msg.sender, 0, 1);
        _burn(msg.sender, 1, 1);
        _burn(msg.sender, 2, 1);

        // Mint token 6
        _mint(msg.sender, 6, 1, ""); // Mint 1 token of type 6
    }

    // Function to get the token balance of the user (only allow checking the caller's balance)
    function tokenBalanceOf(address account, uint256 id) external view returns (uint256) {
        require(msg.sender == account, "You can only check your own balance.");
        return balanceOf(account, id);
    }
}