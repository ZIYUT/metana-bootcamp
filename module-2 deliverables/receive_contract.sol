// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20_contract.sol";
import "./ERC721_contract.sol";

contract NFTMinter is Ownable {
    myToken public token;
    myNFT public nft;
    uint256 public constant TOKEN_COST = 10 * 10**18;

    constructor(address ERC20Contract, address ERC721Contract)  Ownable(msg.sender) {
        token = myToken(ERC20Contract);
        nft = myNFT(ERC721Contract);
    }
    function mint(string memory tokenURI) external {
        require(token.balanceOf(msg.sender) >= TOKEN_COST, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= TOKEN_COST, "Insufficient token allowance");
        token.transferFrom(msg.sender, address(this), TOKEN_COST);
        nft.mintNFT(msg.sender, tokenURI);
    }
}
