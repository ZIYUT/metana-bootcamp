// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./MyTokenUpgradeable.sol";
import "./MyNFTUpgradeable.sol";

contract NFTMinterAndStakerUpgradeable is Initializable, OwnableUpgradeable, IERC721ReceiverUpgradeable, UUPSUpgradeable {
    MyTokenUpgradeable public token;
    MyNFTUpgradeable public nft;

    uint256 public constant MINT_COST = 10 * 10**18; // 铸造成本 10 MTK
    uint256 public constant REWARD_RATE = 10 * 10**18; // 每 24 小时 10 MTK
    uint256 public constant STAKE_DURATION = 24 hours; // 质押周期

    mapping(uint256 => address) public originalOwner; // NFT 的原始拥有者
    mapping(address => uint256) public stakeTimestamps; // 质押时间戳
    mapping(address => uint256) public stakedTokenId; // 用户质押的 NFT ID

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

    // 用户支付 10 MTK 铸造 NFT
    function mintNFT(string memory tokenURI) external {
        require(token.balanceOf(msg.sender) >= MINT_COST, "Insufficient MTK balance");
        require(token.allowance(msg.sender, address(this)) >= MINT_COST, "Insufficient allowance");

        // 先转移代币
        bool success = token.transferFrom(msg.sender, address(this), MINT_COST);
        require(success, "Token transfer failed");

        // 铸造 NFT
        uint256 newTokenId = nft.mintNFT(msg.sender, tokenURI);
        emit NFTMinted(newTokenId, msg.sender, tokenURI);
    }

    // 质押 NFT
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

    // 提取奖励
    function claimRewards() external {
        require(stakedTokenId[msg.sender] != 0, "No NFT staked");
        uint256 timePassed = block.timestamp - stakeTimestamps[msg.sender];
        require(timePassed >= STAKE_DURATION, "Stake duration not met");

        uint256 reward = (timePassed / STAKE_DURATION) * REWARD_RATE;
        stakeTimestamps[msg.sender] = block.timestamp; // 重置时间戳
        token.mint(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    // 撤回 NFT
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

    // 事件
    event NFTMinted(uint256 tokenId, address indexed to, string tokenURI);
    event NFTStaked(uint256 tokenId, address indexed staker);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event NFTWithdrawn(uint256 tokenId, address indexed staker);
}