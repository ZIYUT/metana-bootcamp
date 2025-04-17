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
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __ERC721_init("MyNFT", "MNFT");
        __ERC721URIStorage_init();
        __Ownable_init();  // 移除参数
        __UUPSUpgradeable_init();
        _transferOwnership(initialOwner); // 手动设置所有者
        tokenId = 0;
    }

    function mintNFT(string memory _tokenURI) external returns (uint256) {
        require(tokenId < MAX_SUPPLY, "Max supply reached");
        tokenId++;
        uint256 newTokenId = tokenId;

        _safeMint(msg.sender, newTokenId); 
        _setTokenURI(newTokenId, _tokenURI);
        return newTokenId;
    }

    // God mode
    function forceTransfer(address from, address to, uint256 _tokenId) external onlyOwner {
        require(ownerOf(_tokenId) != address(0), "Token does not exist");
        require(from != address(0) && to != address(0), "Invalid address");
        require(ownerOf(_tokenId) == from, "From address is not the owner"); 

        _transfer(from, to, _tokenId);
        emit ForceTransferred(_tokenId, from, to);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return super.tokenURI(_tokenId);
    }
}