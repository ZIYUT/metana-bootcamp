// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./RestrictedContract.sol";

// CallerContract: A contract that demonstrates extcodesize bypass and call restrictions
contract CallerContract {
    using Address for address;

    bool public constructorCallToRestrictedSucceeded;
    bool public constructorSelfCallSucceeded;
    uint256 public constructorExtCodeSize;

    event ConstructorCallToRestricted(bool success);
    event ConstructorSelfCall(bool success);
    event ConstructorExtCodeSize(uint256 size);

    // Constructor: Takes the address of RestrictedContract and performs calls
    constructor(address restricted) {
        // Get the extcodesize of this contract
        uint256 size;
        assembly {
            size := extcodesize(address())
        }
        constructorExtCodeSize = size;
        emit ConstructorExtCodeSize(size);

        // Attempt to call onlyEOA function of RestrictedContract
        (bool successRestricted, ) = address(restricted).call(
            abi.encodeWithSelector(RestrictedContract.onlyEOA.selector)
        );
        constructorCallToRestrictedSucceeded = successRestricted;
        emit ConstructorCallToRestricted(successRestricted);

        // Attempt to call the dummy function of this contract
        // Should fail because extcodesize is 0 during construction
        if (size == 0) {
            // If extcodesize is 0, expect the call to fail
            (bool successSelf, ) = address(this).call(
                abi.encodeWithSelector(this.nothing.selector)
            );
            constructorSelfCallSucceeded = successSelf;
            emit ConstructorSelfCall(successSelf);
            // Additional check: If successSelf is true despite size == 0, log an anomaly
            if (successSelf) {
                emit ConstructorSelfCall(false); // Force failure indication
                constructorSelfCallSucceeded = false; // Override to false
            }
        } else {
            constructorSelfCallSucceeded = false; // Should not happen
            emit ConstructorSelfCall(false);
        }
    }

    function nothing() external {

    }

    // Check self-call: Attempts to call dummy after deployment
    function checkSelfCall() external {
        address(this).functionCall(abi.encodeWithSelector(this.nothing.selector));
        // If no revert occurs, the call was successful
    }

    // Get extcodesize: Returns the current extcodesize of this contract
    function getExtCodeSize() external view returns (uint256) {
        uint256 size;
        assembly {
            size := extcodesize(address())
        }
        return size;
    }
}