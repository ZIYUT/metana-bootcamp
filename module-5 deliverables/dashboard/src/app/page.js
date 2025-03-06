"use client";
import { useEffect, useState } from "react";
import { getLatestBlock, getNFTTransfers } from "../utils/ethereum";

export default function Dashboard() {
    const [block, setBlock] = useState(null);
    const [nftTransfers, setNFTTransfers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // 获取最新区块信息
            const latestBlock = await getLatestBlock();
            setBlock(latestBlock);

            // 获取 NFT 交易记录（目标地址）
            const toAddress = "0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152";
            const transfers = await getNFTTransfers(toAddress);
            setNFTTransfers(transfers);
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Ethereum Sepolia 实时数据</h1>

            {/* 最新区块信息 */}
            {block ? (
                <div>
                    <p>区块号: {block.number}</p>
                    <p>区块哈希: {block.hash}</p>
                    <p>矿工: {block.miner}</p>
                    <p>Gas 限制: {block.gasLimit.toString()}</p>
                    <p>Gas 使用: {block.gasUsed.toString()}</p>
                </div>
            ) : (
                <p>加载区块数据...</p>
            )}

            {/* NFT 交易信息 */}
            <h2>NFT 交易记录</h2>
            {nftTransfers.length > 0 ? (
                <ul>
                    {nftTransfers.map((tx, index) => (
                        <li key={index}>
                            {tx.from} → {tx.to} 交易了 {tx.value} 个 {tx.asset}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>暂无 NFT 交易</p>
            )}
        </div>
    );
}