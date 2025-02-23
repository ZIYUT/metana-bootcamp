// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;  // Unify the version to 0.8.20 （use the same version as the openzeppelin)

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GodMode is ERC20 {
    address public immutable god;
    mapping(address => bool) private sanctionList;
    uint256 public constant TOKENS_PER_ETH = 1000 * 10 ** 18;
    uint256 public constant ETH_PER_THOUSAND_TOKENS = 0.5 ether;

    constructor(
        string memory tokenName,  // Replace name with tokenName
        string memory tokenSymbol,  // Replace symble with tokenSymbol
        address godAddress
    ) ERC20(tokenName, tokenSymbol) {
        require(godAddress != address(0), "Invalid address: zero address");
        god = godAddress;
    }

    modifier onlyGod() {
        require(msg.sender == god, "You are not god!");
        _;
    }

    modifier maxTokensSupply(uint256 amount) {
        require(
            totalSupply() + amount <= 1000000 * 10 ** 18,
            "No more tokens for sale."
        );
        _;
    }

    // Functions for GOD-MODE

    function mintTokensToAddress(
        address recipient,
        uint256 amount
    ) public onlyGod {
        _mint(recipient, amount);
    }

    function changeBalanceAtAddress(
        address target,
        uint256 newBalance
    ) public onlyGod {
        uint256 balance = balanceOf(target);
        if (newBalance > balance) {
            _mint(target, newBalance - balance);
        }
        if (newBalance < balance) {
            _burn(target, balance - newBalance);
        }
    }

    function authoritativeTransferFrom(
        address from,
        address to,
        uint256 amount
    ) public onlyGod {
        require(balanceOf(from) >= amount, "Insufficient Balance");
        _transfer(from, to, amount);
    }

    // Functions for SANCTIONS

    function addToSanctionList(address add) public onlyGod {
        sanctionList[add] = true;
    }

    function removeFromSanctionList(address add) public onlyGod {
        sanctionList[add] = false;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        if (sanctionList[from] || sanctionList[to]) {
            revert("The sender or receiver was sanctioned.");
        }
        super._update(from, to, value);
    }

    // Functions for TOKEN SALE

    function mintTokens() public payable maxTokensSupply(TOKENS_PER_ETH) onlyGod {
        require(
            msg.value == 1 ether,
            "You should pay exact 1 ETH to buy 1000 tokens."
        );
        _mint(msg.sender, TOKENS_PER_ETH);
    }

    function withdrawETH() public onlyGod {
        uint256 myBalance = address(this).balance;
        require(myBalance > 0, "There is no ETH to withdraw");
        payable(god).transfer(myBalance);
    }

    // Functions for PARTIAL REFOUNDS

    function sellBack(uint256 amount) public {
        uint256 sellBackETH = (amount * ETH_PER_THOUSAND_TOKENS) / TOKENS_PER_ETH;
        require(address(this).balance >= sellBackETH, "ETH is not enough");
        _transfer(msg.sender, address(this), amount);
        payable(msg.sender).transfer(sellBackETH);
    }
}