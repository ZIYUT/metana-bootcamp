"use client";
import { useEffect, useState } from "react";
import { getLatestBlock, getNFTTransfers } from "../utils/ethereum";

export default function Dashboard() {
    const [block, setBlock] = useState(null);
    const [nftTransfers, setNFTTransfers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const latestBlock = await getLatestBlock();
            setBlock(latestBlock);

            const toAddress = "0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152";
            const transfers = await getNFTTransfers(toAddress);
            setNFTTransfers(transfers);
        };

        fetchData();
    }, []);

    const shortenAddress = (address) => {
        return address.slice(0, 6) + "..." + address.slice(-4);
    };

    return (
        <div className="container">
            <h1>Ethereum Sepolia 实时数据</h1>

            {block ? (
                <div className="block-info">
                    <h2>最新区块</h2>
                    <p><strong>区块号:</strong> {block.number}</p>
                    <p><strong>区块哈希:</strong> {shortenAddress(block.hash)}</p>
                    <p><strong>矿工:</strong> {shortenAddress(block.miner)}</p>
                    <p><strong>Gas 限制:</strong> {block.gasLimit.toString()}</p>
                    <p><strong>Gas 使用:</strong> {block.gasUsed.toString()}</p>
                </div>
            ) : (
                <p>加载区块数据...</p>
            )}

            <h2>NFT 交易记录</h2>
            {nftTransfers.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>发送方</th>
                            <th>接收方</th>
                            <th>数量</th>
                            <th>NFT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nftTransfers.map((tx, index) => (
                            <tr key={index}>
                                <td>{shortenAddress(tx.from)}</td>
                                <td>{shortenAddress(tx.to)}</td>
                                <td>{tx.value}</td>
                                <td>{tx.asset || "未知"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>暂无 NFT 交易</p>
            )}
        </div>
    );
}