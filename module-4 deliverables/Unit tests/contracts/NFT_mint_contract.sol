// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

// MyToken 合约，继承 ERC20 和 Ownable 合约
contract MyToken is ERC20, Ownable {
  constructor() ERC20('myToken', 'TKN') Ownable(msg.sender) {
    // Mint 初始的 10 TKN 代币给合约的拥有者
    _mint(msg.sender, 10 * 10 ** 18);
  }
}

// MyNFT 合约，继承 ERC721URIStorage 和 Ownable 合约
contract MyNFT is ERC721URIStorage, Ownable {
  uint256 private tokenID = 0; // 用于递增的 NFT ID

  constructor() ERC721('myNFT', 'NFT') Ownable(msg.sender) {}

  // 改变参数名称，避免与 ERC721 中的 tokenURI 函数冲突
  function mintNFT(
    address recipient,
    string memory newTokenURI
  ) external returns (uint256) {
    tokenID++; // 增加 tokenID
    uint256 itemID = tokenID;

    // 调用 _setTokenURI 先设置 tokenURI，再执行 _safeMint
    _setTokenURI(itemID, newTokenURI); // 设置 NFT 的 tokenURI

    // 使用 _safeMint 来安全地铸造 NFT
    _safeMint(recipient, itemID);

    return itemID; // 返回新铸造的 NFT 的 ID
  }
}

// NFTMinter 合约，继承 Ownable 合约
contract NFTMinter is Ownable {
  // 将 token 和 nft 合约声明为 immutable，优化 gas 使用
  MyToken public immutable token;
  MyNFT public immutable nft;
  uint256 public constant TOKEN_COST = 10 * 10 ** 18; // 定义铸造 NFT 的代币成本

  // 构造函数，在合约部署时传入 ERC20 和 ERC721 合约地址
  constructor(
    address ERC20Contract,
    address ERC721Contract
  ) Ownable(msg.sender) {
    token = MyToken(ERC20Contract); // 初始化 token 合约
    nft = MyNFT(ERC721Contract); // 初始化 nft 合约
  }

  // mint 函数，允许用户使用代币铸造 NFT
  function mint(string memory newTokenURI) external {
    // 检查用户是否拥有足够的代币余额
    require(
      token.balanceOf(msg.sender) >= TOKEN_COST,
      'Insufficient token balance'
    );
    // 检查用户是否授权足够的代币给这个合约
    require(
      token.allowance(msg.sender, address(this)) >= TOKEN_COST,
      'Insufficient token allowance'
    );

    // 先修改状态，再执行外部调用，防止重入攻击
    uint256 newNFTId = nft.mintNFT(msg.sender, newTokenURI);
    require(newNFTId > 0, 'NFT minting failed'); // 确保 NFT 铸造成功

    // 从用户地址转移代币到这个合约地址，并检查返回值
    bool success = token.transferFrom(msg.sender, address(this), TOKEN_COST);
    require(success, 'Token transfer failed'); // 确保 transferFrom 成功

    // 触发事件通知
    emit NFTMinted(newNFTId, msg.sender, newTokenURI);
  }

  // 定义一个事件，记录 NFT 的铸造情况
  event NFTMinted(uint256 tokenId, address indexed to, string tokenURI);
}
