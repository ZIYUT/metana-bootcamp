// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract godMode is ERC20, Ownable {
    address public god;
    constructor(string memory name, string memory symbol, address godAddress) 
    ERC20(name, symbol) Ownable(msg.sender){
        god = godAddress;
    }
    modifier onlyGod() {
        // Check if the god is the sender
        require(msg.sender == god, "You are not god!");
        _;
    }
    function mintTokensToAddress(address recipient, uint256 amount) public onlyGod {
        //Mint the amount of tokens to the recipient by using the function in OpenZeppelin
        _mint(recipient, amount);
    }

    function changeBalanceAtAddress(address target, uint256 newBalance) public onlyGod {
        //Change the balance of the target address to the new balance
        uint256 balance = balanceOf(target);
        if (newBalance > balance) {
            _mint(target, newBalance - balance);
        }
        if (newBalance < balance) {
            _burn(target, balance - newBalance);
        }
    }

    function authoritativeTransferFrom(address from, address to, uint256 amount) public onlyGod {
        //Transfer the amount of balance from one address to another
        require(balanceOf(from) >= amount, "Insufficient Balance");
        _transfer(from, to, amount);
    }
}
