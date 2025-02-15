// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC1155_token_contract.sol";

contract ForgingLogic is Ownable {

    IERC1155 public tokenContract;

    constructor(address _tokenContract) Ownable(msg.sender) {
        tokenContract = IERC1155(_tokenContract);
    }

    function forgeToken3() external {
        // Mint token 3 by burning token 0 and 1
        require(tokenContract.balanceOf(msg.sender, 0) >= 1, "Insufficient token 0");
        require(tokenContract.balanceOf(msg.sender, 1) >= 1, "Insufficient token 1");
        tokenContract.safeTransferFrom(msg.sender, address(this), 0, 1, "");
        tokenContract.safeTransferFrom(msg.sender, address(this), 1, 1, "");
        ERC1155Token(address(tokenContract)).mint(3, 1);
    }

    function forgeToken4() external {
        // Mint token 4 by burning token 1 and 2
        require(tokenContract.balanceOf(msg.sender, 1) >= 1, "Insufficient token 1");
        require(tokenContract.balanceOf(msg.sender, 2) >= 1, "Insufficient token 2");
        tokenContract.safeTransferFrom(msg.sender, address(this), 1, 1, "");
        tokenContract.safeTransferFrom(msg.sender, address(this), 2, 1, "");
        ERC1155Token(address(tokenContract)).mint(4, 1);
    }
    
    function forgeToken5() external {
        // Mint token 5 by burning token 0 and 2
        require(tokenContract.balanceOf(msg.sender, 0) >= 1, "Insufficient token 0");
        require(tokenContract.balanceOf(msg.sender, 2) >= 1, "Insufficient token 2");
        tokenContract.safeTransferFrom(msg.sender, address(this), 0, 1, "");
        tokenContract.safeTransferFrom(msg.sender, address(this), 2, 1, "");
        ERC1155Token(address(tokenContract)).mint(5, 1);
    }
    
    function forgeToken6() external {
        // Mint token 6 by burning token 0, 1, and 2
        require(tokenContract.balanceOf(msg.sender, 0) >= 1, "Insufficient token 0");
        require(tokenContract.balanceOf(msg.sender, 1) >= 1, "Insufficient token 1");
        require(tokenContract.balanceOf(msg.sender, 2) >= 1, "Insufficient token 2");
        tokenContract.safeTransferFrom(msg.sender, address(this), 0, 1, "");
        tokenContract.safeTransferFrom(msg.sender, address(this), 1, 1, "");
        tokenContract.safeTransferFrom(msg.sender, address(this), 2, 1, "");
        ERC1155Token(address(tokenContract)).mint(6, 1);
    }
}