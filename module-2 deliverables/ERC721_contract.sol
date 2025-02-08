// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myNFT is ERC721URIStorage, Ownable {
    uint256 private tokenID = 0;

    constructor() ERC721("myNFT", "NFT") Ownable(msg.sender) {}

    function mintNFT(address recipient, string memory tokenURI) external onlyOwner returns (uint256) {
        tokenID++;
        uint256 itemID = tokenID;
        _safeMint(recipient, itemID);
        _setTokenURI(itemID, tokenURI);
        return itemID;
    }
}