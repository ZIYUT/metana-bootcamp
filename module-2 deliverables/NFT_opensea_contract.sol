// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';

contract MyNFT is ERC721URIStorage, Ownable {
  uint256 private tokenIds = 0;
  string private baseTokenURI;
  uint256 public constant MAX_SUPPLY = 10;

  constructor(
    string memory baseURI
  ) ERC721('myNFT', 'NFT') Ownable(msg.sender) {
    baseTokenURI = baseURI;
  }

  // 修正mintNFT函数，确保先更新状态再调用外部函数，防止重入攻击
  function mintNFT(
    address recipient,
    string memory newTokenURI
  ) external onlyOwner {
    require(tokenIds < MAX_SUPPLY, 'No more NFTs can be minted.');
    tokenIds++;

    // 先更新状态再调用外部函数
    _safeMint(recipient, tokenIds);
    _setTokenURI(tokenIds, newTokenURI); // 改名以避免与 ERC721 的 tokenURI 重名
  }
}
