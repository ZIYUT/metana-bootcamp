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

    uint256 public constant MINT_COST = 10 * 10**18;
    uint256 public constant REWARD_RATE = 10 * 10**18;
    uint256 public constant STAKE_DURATION = 5 seconds;

    mapping(uint256 => address) public originalOwner;
    mapping(address => uint256) public stakeTimestamps;
    mapping(address => uint256) public stakedTokenId;

    event NFTMinted(uint256 tokenId, address indexed to, string tokenURI);
    event NFTStaked(uint256 tokenId, address indexed staker);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event NFTWithdrawn(uint256 tokenId, address indexed staker);

    constructor() {
        _disableInitializers(); 
    }

    function initialize(address initialOwner, address tokenAddress, address nftAddress) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        token = MyTokenUpgradeable(tokenAddress);
        nft = MyNFTUpgradeable(nftAddress);
    }

    function mintNFT(string memory tokenURI) external {
        require(token.balanceOf(msg.sender) >= MINT_COST, "Insufficient MTK balance");
        require(token.allowance(msg.sender, address(this)) >= MINT_COST, "Insufficient allowance");
        bool success = token.transferFrom(msg.sender, address(this), MINT_COST);
        require(success, "Token transfer failed");
        uint256 newTokenId = nft.mintNFT(tokenURI); // 调用新的 mintNFT，只传 tokenURI
        emit NFTMinted(newTokenId, msg.sender, tokenURI);
    }

    function stakeNFT(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        require(stakedTokenId[msg.sender] == 0, "Already staking an NFT");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Not approved");

        originalOwner[tokenId] = msg.sender;
        stakeTimestamps[msg.sender] = block.timestamp;
        stakedTokenId[msg.sender] = tokenId;

        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        emit NFTStaked(tokenId, msg.sender);
    }

    function claimRewards() external {
        require(stakedTokenId[msg.sender] != 0, "No NFT staked");
        uint256 timePassed = block.timestamp - stakeTimestamps[msg.sender];
        require(timePassed >= STAKE_DURATION, "Stake duration not met");

        uint256 reward = (timePassed / STAKE_DURATION) * REWARD_RATE;
        stakeTimestamps[msg.sender] = block.timestamp;
        token.mint(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function withdrawNFT() external {
        uint256 tokenId = stakedTokenId[msg.sender];
        require(tokenId != 0, "No NFT staked");
        require(originalOwner[tokenId] == msg.sender, "Not the original owner");
        delete originalOwner[tokenId];
        delete stakeTimestamps[msg.sender];
        delete stakedTokenId[msg.sender];
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        emit NFTWithdrawn(tokenId, msg.sender);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}