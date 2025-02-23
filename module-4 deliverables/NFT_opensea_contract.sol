// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721URIStorage, Ownable {
  uint256 private tokenIds = 0;
  string private baseTokenURI;
  uint256 public constant MAX_SUPPLY = 10;

  constructor(
    string memory baseURI
  ) ERC721("myNFT", "NFT") Ownable(msg.sender) {
    baseTokenURI = baseURI;
  }

  function mintNFT(
    address recipient,
    string memory tokenURI
  ) external onlyOwner {
    require(tokenIds < MAX_SUPPLY, "No more NFTs can be minted.");
    tokenIds++;
    _safeMint(recipient, tokenIds);
    _setTokenURI(tokenIds, tokenURI);
  }
}
