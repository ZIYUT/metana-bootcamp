// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract godMode is ERC20, Ownable {
    address public god;
    mapping(address => bool) private sanctionList; // Create a map to save the sanctioned addresses
    uint256 public constant TOKENS_PER_ETH = 1000 * 10**18; // 1000 tokens for each paid ether
    uint256 public constant ETH_PER_THOUSAND_TOKENS = 0.5 ether; // 0.5 ether for 1000 tokens

    constructor(string memory name, string memory symbol, address godAddress) 
    ERC20(name, symbol) Ownable(msg.sender){
        god = godAddress;
    }
    modifier onlyGod() {
        // Check if the god is the sender
        require(msg.sender == god, "You are not god!");  // Who is god?  Owner? Or Sender?
        _;
    }

    modifier maxTokensSupply(uint256 amount){
        require(totalSupply() + amount <= 1000000 * 10**18, "No more tokens for sale.");
        _;
    }

    // Fucntions for GOD-MODE

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

    // Fucntions for SANCTIONS

    function addToSanctionList(address add) public onlyGod{
        sanctionList[add] = true;
    }
    function removeFromSanctionList(address add) public onlyGod{
        sanctionList[add] = false;
    }
    function transaction(address from, address to, uint256 amount) public {
        // Override the _update function, only the address not sanctioned was allowed to send or receive tokens.
        if (sanctionList[from]||sanctionList[to]){
            revert("The sender or receiver was sanctioned.");
        }
        else {
            if (balanceOf(from) < amount){
                revert("Insufficient Balance");
            }
            else {
                _transfer(from, to , amount);
            }
        }
    }

    // Fucntions for TOKEN SALE

    function mintTokens() public payable maxTokensSupply(TOKENS_PER_ETH){
        // Mint 1000 tokens for each paid ETH
        require(msg.value == 1 ether, "You should pay exact 1 ETH to buy 1000 tokens.");
        _mint(msg.sender, TOKENS_PER_ETH);
    }
    function withdrawETH() public onlyGod{
        // Only I can withdraw ETH
        uint myBalance = address(this).balance;
        require(myBalance > 0, "There is no ETH to withdraw");
        payable(god).transfer(myBalance);
    }

    //Functions for PARTIAL REFOUNDS

    function sellBack(uint256 amount) public {
        // Allow users to partial sell back their token with the rate of 0.5 ether for every 1000 tokens.
        uint256 sellBackETH = (amount * ETH_PER_THOUSAND_TOKENS) / TOKENS_PER_ETH;
        require(address(this).balance >= sellBackETH, "ETH is not enough");
        _transfer(msg.sender, address(this), amount);
          payable(msg.sender).transfer(sellBackETH);
    }

}
