// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myNFT is ERC721URIStorage, Ownable {
    uint256 private tokenIds = 0;
    string private baseTokenURI;
    uint256 public constant MAX_SUPPLY = 10;

    constructor(string memory baseURI) ERC721("myNFT", "NFT") Ownable(msg.sender) {
        baseTokenURI = baseURI;
    }

    function mint(address recipient, string memory tokenURI) external onlyOwner {
        require(tokenIds < MAX_SUPPLY, "No more NFTs can be minted.");
        tokenIds++;
        _safeMint(recipient, tokenIds);
        _setTokenURI(tokenIds, tokenURI);
    }

    // function _baseURI() internal view override returns (string memory) {
    //     return baseTokenURI;
    // }
}