// deploy.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  // 读取合约源代码并编译
  const source = fs.readFileSync('./CryptoWallet.sol', 'utf8');
  
  // 连接到网络
  const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/bA5XfMFqseqSauR46dvb8--1C5qQgoXI');
  
  // 使用私钥创建钱包实例
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`准备使用地址部署: ${wallet.address}`);
  
  // 编译合约
  console.log('编译合约...');
  const solc = require('solc');
  
  const input = {
    language: 'Solidity',
    sources: {
      'CryptoWallet.sol': {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts['CryptoWallet.sol']['CryptoWallet'];
  
  // 部署合约
  console.log('部署合约...');
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployedContract = await factory.deploy();
  
  console.log(`等待确认...`);
  await deployedContract.deployed();
  
  console.log(`合约已部署到地址: ${deployedContract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });