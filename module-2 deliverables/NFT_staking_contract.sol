// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myToken is ERC20, Ownable {
    constructor() ERC20("myToken", "TKN") Ownable(msg.sender) {
        _mint(msg.sender, 10 * 10**18);
    }
    function mint(address add, uint256 amount) external onlyOwner {
        _mint(add, amount);
    }
}

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

contract NFTStaker is Ownable, IERC721Receiver {
    myToken public token;
    myNFT public nft;
    mapping(uint256 => address) public  originalOwner;
    mapping(address => uint256) public timestamps;
    uint256 public constant REWARD_RATE = 10 * 10**18;
    uint256 public constant STAKE_DURATION = 1 minutes; // Use 1 min for testing, change to 24 hours in production

    struct StakedNFT {
        address owner;
        uint256 stakedAt;
    }

    constructor(address TOKEN, address NFT) Ownable(msg.sender){
        token = myToken(TOKEN);
        nft = myNFT(NFT);
    }

    function depositNFT(uint256 tokenID) external {
        originalOwner[tokenID] =msg.sender;
        timestamps[msg.sender] = block.timestamp;
        nft.safeTransferFrom(msg.sender, address(this), tokenID);
    }

    function withdrawNFT(uint256 tokenID) external {
        require(originalOwner[tokenID] == msg.sender, "Not the original owner");
        nft.safeTransferFrom(address(this), msg.sender, tokenID);
        delete originalOwner[tokenID];
        delete timestamps[msg.sender];
    }

    function rewards() external {
        uint256 timePassed = block.timestamp - timestamps[msg.sender];
        require(timePassed >= STAKE_DURATION, "Not long enough to receive the rewards");
        uint256 rewardToken= (timePassed / STAKE_DURATION) * REWARD_RATE;
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
}
