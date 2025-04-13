# String and BitWise Contracts

## String.sol
`String` contract extracts characters from strings using assembly for efficiency.

- **`charAt(string memory input, uint256 index)`**: Returns `bytes2` with the character at `index`. Returns `0x0000` for empty strings or invalid indices. E.g., `charAt("abcdef", 2)` returns `0x6300` ('c').

## BitWise.sol
`BitWise` counts set bits in a `uint8` with Solidity and assembly versions.

- **`countBitSet(uint8 data)`**: Loops to count 1s in `data`. E.g., `countBitSet(7)` returns `3` (binary `00000111`).
- **`countBitSetAsm(uint8 data)`**: Same logic in assembly for gas savings.
- Re-implemented `countBitSetAsm()` with inline assembly.


## Test Cases for String.sol

- `charAt("abcdef", 2)` → `0x6300` ('c')
- `charAt("", 0)` → `0x0000` (empty string)
- `charAt("george", 10)` → `0x0000` (out of bounds)
