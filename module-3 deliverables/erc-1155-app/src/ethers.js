import { ethers } from "ethers";
import { contractAddress, ERC1155_ABI } from './contractConfig'; // 引入ABI和合约地址

// 设置Sopholia网络的RPC地址
const SOPHOLIA_RPC_URL = "https://rpc.sopholia.io"; // Sopholia的RPC地址

// 创建一个ethers provider，连接到Sopholia网络
const provider = new ethers.JsonRpcProvider(SOPHOLIA_RPC_URL);

// 创建合约实例
const getContract = (signer) => {
  return new ethers.Contract(contractAddress, ERC1155_ABI, signer || provider);
};

// 获取账户余额
export const getBalance = async (account, tokenId) => {
  const contract = getContract();
  try {
    const balance = await contract.balanceOf(account, tokenId);
    return balance.toString();
  } catch (error) {
    console.error("Error getting balance:", error);
  }
};

// 处理mint操作
export const mintToken = async (tokenId, signer) => {
  const contract = getContract(signer);
  try {
    const tx = await contract[`mintToken${tokenId}`]();
    console.log(`Minting Token ${tokenId}...`);
    const hash = tx.hash;
    const trx = await tx.getTransaction();
    // 使用 tx.wait() 来等待交易确认
    const receipt = await trx.wait(); // 等待交易完成并返回回执（receipt）

    // 交易确认后，输出区块号
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`Minted Token ${tokenId}`);
    return true;
  } catch (error) {
    console.error("Error minting token:", error);
    return false;
  }
};

// 连接到钱包并获取Signer
export const getSigner = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
  } else {
    alert("Please install MetaMask");
    return null;
  }
};