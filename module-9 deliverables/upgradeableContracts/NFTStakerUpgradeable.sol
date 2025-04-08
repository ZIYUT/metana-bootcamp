// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./MyTokenUpgradeable.sol";
import "./MyNFTUpgradeable.sol";

contract NFTStakerUpgradeable is Initializable, OwnableUpgradeable, IERC721ReceiverUpgradeable, UUPSUpgradeable {
    MyTokenUpgradeable public token;
    MyNFTUpgradeable public nft;
    
    mapping(uint256 => address) public originalOwner;
    mapping(address => uint256) public timestamps;
    
    uint256 public constant REWARD_RATE = 10 * 10**18;
    uint256 public constant STAKE_DURATION = 24 hours;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner, address tokenAddress, address nftAddress) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        token = MyTokenUpgradeable(tokenAddress);
        nft = MyNFTUpgradeable(nftAddress);
    }
    
    function withdrawNFT(uint256 tokenID) external {
        require(originalOwner[tokenID] == msg.sender, "Not the original owner");
        
        delete originalOwner[tokenID];
        delete timestamps[msg.sender];
        
        nft.safeTransferFrom(address(this), msg.sender, tokenID);
    }
    
    function depositNFT(uint256 tokenID) external {
        require(nft.ownerOf(tokenID) == msg.sender, "You are not the NFT owner");
        require(
            nft.getApproved(tokenID) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );
        
        originalOwner[tokenID] = msg.sender;
        timestamps[msg.sender] = block.timestamp;
        
        nft.safeTransferFrom(msg.sender, address(this), tokenID);
    }
    
    function rewards() external {
        uint256 timePassed = block.timestamp - timestamps[msg.sender];
        require(
            timePassed >= STAKE_DURATION,
            "Not long enough to receive the rewards"
        );
        
        uint256 rewardToken = (timePassed * REWARD_RATE) / STAKE_DURATION;
        timestamps[msg.sender] = block.timestamp;
        token.mint(msg.sender, rewardToken);
    }
    
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    // Required override for UUPS upgradeable pattern
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}