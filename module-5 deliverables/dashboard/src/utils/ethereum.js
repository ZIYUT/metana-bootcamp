import { JsonRpcProvider } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";

// 读取环境变量
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_RPC_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const provider = new JsonRpcProvider(ALCHEMY_RPC_URL);

// 配置 Alchemy SDK
const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

// ✅ 获取最新区块
export const getLatestBlock = async () => {
    try {
        const block = await provider.getBlock("latest");
        console.log("✅ 最新区块:", block);
        return block;
    } catch (error) {
        console.error("❌ 获取最新区块失败:", error);
        return null;
    }
};

// ✅ 获取 NFT 交易记录
export const getNFTTransfers = async (toAddress) => {
    try {
        const response = await alchemy.core.getAssetTransfers({
            fromBlock: "0x0",
            fromAddress: "0x0000000000000000000000000000000000000000",
            toAddress: toAddress,
            excludeZeroValue: true,
            category: ["erc721", "erc1155"], // 获取 NFT 交易
        });

        console.log(`✅ NFT 交易记录 for ${toAddress}:`, response.transfers);
        return response.transfers;
    } catch (error) {
        console.error("❌ 获取 NFT 交易失败:", error);
        return [];
    }
};