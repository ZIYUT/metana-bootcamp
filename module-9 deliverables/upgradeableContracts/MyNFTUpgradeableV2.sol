// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../v1/MyNFTUpgradeable.sol";

contract MyNFTUpgradeableV2 is MyNFTUpgradeable {
    // Event for tracking god mode transfers
    event GodModeTransfer(address indexed operator, address indexed from, address indexed to, uint256 tokenId);
    
    /**
     * @dev Allows the contract owner to forcefully transfer an NFT between accounts
     * @param from The current owner of the NFT
     * @param to The new owner address
     * @param tokenId The ID of the NFT to transfer
     */
    function godModeTransfer(address from, address to, uint256 tokenId) external onlyOwner {
        require(to != address(0), "Transfer to the zero address");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(_ownerOf(tokenId) == from, "From address is not the owner");
        
        // Perform the forced transfer
        _transfer(from, to, tokenId);
        
        // Emit specific event for tracking purposes
        emit GodModeTransfer(msg.sender, from, to, tokenId);
    }
    
    /**
     * @dev Returns whether this contract includes god mode functionality
     */
    function hasGodMode() external pure returns (bool) {
        return true;
    }
}