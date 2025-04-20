// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoWallet {

    address public owner;

    event Deposit(address indexed from, uint256 amount);
    event ETHTransferred(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function transferETH(address payable _to, uint256 _amount) external {
        require(msg.sender == owner, "Only owner can transfer");
        require(address(this).balance >= _amount, "Insufficient ETH balance");
        _to.transfer(_amount);
        emit ETHTransferred(_to, _amount);
    }

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
}