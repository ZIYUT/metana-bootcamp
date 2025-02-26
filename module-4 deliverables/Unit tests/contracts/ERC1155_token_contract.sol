// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract ERC1155Token is ERC1155, Ownable {
  mapping(address => uint256) public lastMintTime;

  constructor()
    ERC1155('https://api.example.com/api/token/{id}.json')
    Ownable(msg.sender)
  {}

  function mintToken0() external {
    // Mint function for token 0 (with cooldown)
    require(
      //Faulty tests happened by runing mutation test
      block.timestamp >= lastMintTime[msg.sender] + 3 seconds,
      'Cooldown: Try again in 3 seconds'
    );
    lastMintTime[msg.sender] = block.timestamp;
    _mint(msg.sender, 0, 1, '');
  }

  function mintToken1() external {
    // Mint function for token 1 (with cooldown)
    require(
      //Faulty tests happened by runing mutation test
      block.timestamp >= lastMintTime[msg.sender] + 3 seconds,
      'Cooldown: Try again in 3 seconds'
    );
    lastMintTime[msg.sender] = block.timestamp;
    _mint(msg.sender, 1, 1, '');
  }

  function mintToken2() external {
    // Mint function for token 2 (with cooldown)
    require(
      //Faulty tests happened by runing mutation test
      block.timestamp >= lastMintTime[msg.sender] + 3 seconds,
      'Cooldown: Try again in 3 seconds'
    );
    lastMintTime[msg.sender] = block.timestamp;
    _mint(msg.sender, 2, 1, '');
  }

  function mintToken3() external {
    // Mint token 3 by burning token 0 and 1
    require(
      //Faulty tests happened by runing mutation test
      balanceOf(msg.sender, 0) >= 1,
      'Insufficient token 0 to mint token 3'
    );
    require(
      //Faulty tests happened by runing mutation test
      balanceOf(msg.sender, 1) >= 1,
      'Insufficient token 1 to mint token 3'
    );
    // Burn token 0 and 1
    _burn(msg.sender, 0, 1);
    _burn(msg.sender, 1, 1);
    // Mint token 3
    _mint(msg.sender, 3, 1, '');
  }

  function mintToken4() external {
    // Mint token 4 by burning token 1 and 2
    require(
      //Faulty tests happened by runing mutation test
      balanceOf(msg.sender, 1) >= 1,
      'Insufficient token 1 to mint token 4'
    );
    require(
      //Faulty tests happened by runing mutation test
      balanceOf(msg.sender, 2) >= 1,
      'Insufficient token 2 to mint token 4'
    );
    // Burn token 1 and 2
    _burn(msg.sender, 1, 1);
    _burn(msg.sender, 2, 1);
    // Mint token 4
    _mint(msg.sender, 4, 1, '');
  }

  function mintToken5() external {
    // Mint token 5 by burning token 0 and 2
    require(
      //Faulty tests happened by runing mutation test
      balanceOf(msg.sender, 0) >= 1,
      'Insufficient token 0 to mint token 5'
    );
    require(
      balanceOf(msg.sender, 2) >= 1,
      'Insufficient token 2 to mint token 5'
    );
    // Burn token 0 and 2
    _burn(msg.sender, 0, 1);
    _burn(msg.sender, 2, 1);
    // Mint token 5
    _mint(msg.sender, 5, 1, '');
  }

  function mintToken6() external {
    // Mint token 6 by burning token 0, 1, and 2
    require(
      balanceOf(msg.sender, 0) >= 1,
      'Insufficient token 0 to mint token 6'
    );
    require(
      balanceOf(msg.sender, 1) >= 1,
      'Insufficient token 1 to mint token 6'
    );
    require(
      balanceOf(msg.sender, 2) >= 1,
      'Insufficient token 2 to mint token 6'
    );
    // Burn token 0, 1, and 2
    _burn(msg.sender, 0, 1);
    _burn(msg.sender, 1, 1);
    _burn(msg.sender, 2, 1);
    // Mint token 6
    _mint(msg.sender, 6, 1, '');
  }

  function tokenBalanceOf(
    address account,
    uint256 id
  ) external view returns (uint256) {
    // Function to get the token balance of the user
    require(msg.sender == account, 'You can only check your own balance.');
    return balanceOf(account, id);
  }
}
