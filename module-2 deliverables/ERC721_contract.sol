// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myNFT is ERC721URIStorage, Ownable {
    uint256 private tokenID = 0;

    constructor() ERC721("myNFT", "NFT") Ownable(msg.sender) {}

    function mintNFT(address recipient, string memory tokenURI) external returns (uint256) {
        tokenID++;
        uint256 itemID = tokenID;
        _safeMint(recipient, itemID);
        _setTokenURI(itemID, tokenURI);
        return itemID;
    }
}
contract myToken is ERC20, Ownable {
    constructor() ERC20("myToken", "TKN") Ownable(msg.sender) {
        _mint(msg.sender, 10 * 10**18);
    }
}
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