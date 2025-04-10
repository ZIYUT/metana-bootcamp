// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyNFTUpgradeable_New is Initializable, ERC721URIStorageUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 private tokenId;
    uint256 public constant MAX_SUPPLY = 10;
    event ForceTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __ERC721_init("MyNFT", "MNFT");
        __ERC721URIStorage_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        tokenId = 0;
    }

    function mintNFT(string memory tokenURI) external returns (uint256) {
        require(tokenId < MAX_SUPPLY, "Max supply reached");
        tokenId++;
        uint256 newTokenId = tokenId;

        _safeMint(msg.sender, newTokenId); 
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }

    // God mode
    function forceTransfer(address from, address to, uint256 tokenId) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        require(from != address(0) && to != address(0), "Invalid address");
        require(ownerOf(tokenId) == from, "From address is not the owner"); 

        _transfer(from, to, tokenId);
        emit ForceTransferred(tokenId, from, to);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return super.tokenURI(_tokenId);
    }
}