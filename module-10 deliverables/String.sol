// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract String {
    function charAt(string memory input, uint256 index) public pure returns (bytes2) {
        assembly {
            let len := mload(input)
            if or(iszero(len), gt(index, sub(len, 1))) {
                mstore(0, 0)
                return(0, 32)
            }
            let dataPtr := add(input, 32)
            let p := add(dataPtr, index)
            let word := mload(p)
            let char_byte := shr(248, word)
            let result := shl(248, char_byte)
            mstore(0, result)
            return(0, 32)
        }
    }
}