// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./RestrictedContract.sol";

contract CallerContract {
    using Address for address;

    bool public constructorCallToRestrictedSucceeded;
    bool public constructorSelfCallSucceeded;
    uint256 public constructorExtCodeSize;

    event ConstructorCallToRestricted(bool success);
    event ConstructorSelfCall(bool success);
    event ConstructorExtCodeSize(uint256 size);

    constructor(address restricted) {
        uint256 size;
        assembly {
            size := extcodesize(address())
        }
        constructorExtCodeSize = size;
        emit ConstructorExtCodeSize(size);
        (bool successRestricted, ) = address(restricted).call(
            abi.encodeWithSelector(RestrictedContract.onlyEOA.selector)
        );
        constructorCallToRestrictedSucceeded = successRestricted;
        emit ConstructorCallToRestricted(successRestricted);

        if (size == 0) {
            (bool successSelf, ) = address(this).call(
                abi.encodeWithSelector(this.nothing.selector)
            );
            constructorSelfCallSucceeded = successSelf;
            emit ConstructorSelfCall(successSelf);
            if (successSelf) {
                emit ConstructorSelfCall(false); 
                constructorSelfCallSucceeded = false;
            }
        } else {
            constructorSelfCallSucceeded = false;
            emit ConstructorSelfCall(false);
        }
    }

    function nothing() external {

    }
    function checkSelfCall() external {
        address(this).functionCall(abi.encodeWithSelector(this.nothing.selector));
        // If no revert occurs, the call was successful
    }

    function getExtCodeSize() external view returns (uint256) {
        uint256 size;
        assembly {
            size := extcodesize(address())
        }
        return size;
    }
}