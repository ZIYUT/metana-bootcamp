const { ethers } = require("ethers");

// 用户地址
const userAddress = "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB";

// 秘密值（uint256 类型，数字）
const secret = 12345; // 您可以选择任意数字，或者随机生成

// 生成 _commitment
const commitment = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [userAddress, secret]
  )
);

console.log("Commitment:", commitment);
console.log("Secret (save for reveal):", secret);