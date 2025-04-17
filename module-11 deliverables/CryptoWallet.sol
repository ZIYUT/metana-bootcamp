// Wallet.sol
pragma solidity ^0.8.0;

// ERC-20 接口
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract BasicWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // 接收 ETH
    receive() external payable {}

    // 转移 ETH
    function transferETH(address payable _to, uint256 _amount) external {
        require(msg.sender == owner, "Only owner can transfer");
        require(address(this).balance >= _amount, "Insufficient ETH balance");
        _to.transfer(_amount);
    }

    // 转移 ERC-20 代币
    function transferToken(address _token, address _to, uint256 _amount) external {
        require(msg.sender == owner, "Only owner can transfer");
        IERC20 token = IERC20(_token);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient token balance");
        require(token.transfer(_to, _amount), "Token transfer failed");
    }

    // 查询钱包余额（ETH）
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // 查询代币余额
    function getTokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }
}