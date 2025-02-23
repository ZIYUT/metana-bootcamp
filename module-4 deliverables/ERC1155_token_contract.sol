// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ERC1155Token is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;

    mapping(address => uint256) public lastMintTime;

    constructor() 
        ERC1155("https://api.example.com/api/token/{id}.json")
        Ownable()
    {}

    function _checkCooldown() internal {
        uint256 cooldownPeriod = 3;  // 3 seconds or choose a suitable block interval
        uint256 lastMint = lastMintTime[msg.sender];
        require(block.timestamp >= lastMint + cooldownPeriod, "Cooldown: Try again in 3 seconds");
        lastMintTime[msg.sender] = block.timestamp;
    }

    function _checkAndBurn(address account, uint256 tokenId, uint256 amount) internal {
        require(balanceOf(account, tokenId) >= amount, 
                string(abi.encodePacked("Insufficient token ", tokenId.toString(), " to mint token")));
        _burn(account, tokenId, amount);
    }

    // 防止重入攻击，使用 nonReentrant 修饰符
    function mintToken0() external nonReentrant {
        _checkCooldown();
        _mint(msg.sender, 0, 1, "");
    }

    function mintToken1() external nonReentrant {
        _checkCooldown();
        _mint(msg.sender, 1, 1, "");
    }

    function mintToken2() external nonReentrant {
        _checkCooldown();
        _mint(msg.sender, 2, 1, "");
    }

    // 防止重入攻击，使用 nonReentrant 修饰符
    function mintToken3() external nonReentrant {
        _checkAndBurn(msg.sender, 0, 1); // Burn token 0
        _checkAndBurn(msg.sender, 1, 1); // Burn token 1
        _mint(msg.sender, 3, 1, "");
    }

    // 防止重入攻击，使用 nonReentrant 修饰符
    function mintToken4() external nonReentrant {
        _checkAndBurn(msg.sender, 1, 1); // Burn token 1
        _checkAndBurn(msg.sender, 2, 1); // Burn token 2
        _mint(msg.sender, 4, 1, "");
    }

    // 防止重入攻击，使用 nonReentrant 修饰符
    function mintToken5() external nonReentrant {
        _checkAndBurn(msg.sender, 0, 1); // Burn token 0
        _checkAndBurn(msg.sender, 2, 1); // Burn token 2
        _mint(msg.sender, 5, 1, "");
    }

    // 防止重入攻击，使用 nonReentrant 修饰符
    function mintToken6() external nonReentrant {
        _checkAndBurn(msg.sender, 0, 1); // Burn token 0
        _checkAndBurn(msg.sender, 1, 1); // Burn token 1
        _checkAndBurn(msg.sender, 2, 1); // Burn token 2
        _mint(msg.sender, 6, 1, "");
    }

    function tokenBalanceOf(address account, uint256 id) external view returns (uint256) {
        require(msg.sender == account, "You can only check your own balance.");
        return balanceOf(account, id);
    }
}