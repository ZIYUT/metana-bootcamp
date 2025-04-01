const { ethers } = require("ethers");

const userAddress = "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db";

const secret = 1234; // Random secret number

const commitment = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [userAddress, secret]
  )
);

console.log("Commitment:", commitment);
console.log("Secret (save for reveal):", secret);