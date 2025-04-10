// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyTokenUpgradeable is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __ERC20_init("myToken", "TKN");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        // Mint initial 10 TKN to contract owner
        _mint(initialOwner, 10 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // Required override for UUPS upgradeable pattern
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}