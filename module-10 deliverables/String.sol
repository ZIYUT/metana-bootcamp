// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract String {
    function charAt(string memory input, uint256 index) public pure returns (bytes2) {
        assembly {
            // Get the length of the input 
            let len := mload(input)
            
            // Check if the input is empty or index is out of bounds
            if or(iszero(len), gt(index, sub(len, 1))) { 
                // Return 0x0000 for invalid inputs
                mstore(0, 0)
                return(0, 32)
            }
            
            // Calculate pointer to the start of string data
            let dataPointer := add(input, 32)
            
            // Calculate pointer to the specific character position
            let p := add(dataPointer, index)
            
            // Load full 32-byte word containing our character
            let word := mload(p)
            
            // Extract the first byte from the loaded word
            // (right shift by 248 bits = 31 bytes)
            let char_byte := shr(248, word)
            
            // Lefe shift 248 bits for formatting the result as 0xXX00
            let result := shl(248, char_byte)
            
            // Store result in memory position 0
            mstore(0, result)
            
            // Return 32 bytes from memory position 0
            return(0, 32)
            // charAt("abcdef", 2) should return 0x6300
            // charAt("", 0) should return 0x0000
            // charAt("george", 10) should return 0x0000
        }
    }
}