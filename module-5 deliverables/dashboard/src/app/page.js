"use client";
import { useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Configuration for Alchemy and Provider
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const provider = new JsonRpcProvider(ALCHEMY_RPC_URL);
const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
});

// ERC20 token address (mainnet USDC)
const TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// Decimal places for the token (USDC has 6 decimals)
const tokenDecimals = 6;

export default function Dashboard() {
  const [blocksData, setBlocksData] = useState([]);

  useEffect(() => {
    // Initialization function to get data for the latest 10 blocks
    const init = async () => {
      try {
        const latestBlockNumber = await provider.getBlockNumber();
        console.log("Latest block number:", latestBlockNumber); // Debugging
        const fromBlock = Math.max(latestBlockNumber - 9, 0);
        const toBlock = latestBlockNumber;

        // Get block data
        const blockNumbers = Array.from({ length: toBlock - fromBlock + 1 }, (_, i) => fromBlock + i);
        const blocks = await Promise.all(blockNumbers.map(num => provider.getBlock(num)));

        // Get ERC20 transfer data for the specified range
        const transfers = await alchemy.core.getAssetTransfers({
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
          contractAddresses: [TOKEN_ADDRESS],
          category: ["erc20"],
          excludeZeroValue: true,
        });
        console.log("Transfers:", transfers); // Debugging

        // Group transfers by block number and calculate total volume per block
        const transfersByBlock = transfers.transfers.reduce((acc, transfer) => {
          const blockNum = parseInt(transfer.blockNum, 16);
          if (!acc[blockNum]) acc[blockNum] = [];
          acc[blockNum].push(transfer);
          return acc;
        }, {});

        const volumes = {};
        for (const blockNum in transfersByBlock) {
          volumes[blockNum] = transfersByBlock[blockNum].reduce((sum, tx) => {
            const value = parseFloat(tx.value);
            const volumeInToken = value / (10 ** tokenDecimals);
            return sum + volumeInToken;
          }, 0);
        }

        // Construct initial blocks data
        const initialBlocksData = blocks.map(block => ({
          blockNumber: block.number,
          baseFeePerGas: block.baseFeePerGas ? parseFloat(block.baseFeePerGas.toString()) / 1e9 : 0,
          gasUsed: parseFloat(block.gasUsed.toString()),
          gasLimit: parseFloat(block.gasLimit.toString()),
          erc20TransferVolume: volumes[block.number] || 0,
        }));

        setBlocksData(initialBlocksData);
        console.log("Initial blocksData:", initialBlocksData); // Debugging
      } catch (error) {
        console.error("Initialization failed:", error);
      }
    };

    init();

    // Listen for new blocks
    const handleNewBlock = async (blockNumber) => {
      try {
        const block = await provider.getBlock(blockNumber);
        const transfers = await alchemy.core.getAssetTransfers({
          fromBlock: `0x${blockNumber.toString(16)}`,
          toBlock: `0x${blockNumber.toString(16)}`,
          contractAddresses: [TOKEN_ADDRESS],
          category: ["erc20"],
          excludeZeroValue: true,
        });

        const volume = transfers.transfers.reduce((sum, tx) => {
          const value = parseFloat(tx.value);
          const volumeInToken = value / (10 ** tokenDecimals);
          return sum + volumeInToken;
        }, 0);

        const newBlockData = {
          blockNumber: block.number,
          baseFeePerGas: block.baseFeePerGas ? parseFloat(block.baseFeePerGas.toString()) / 1e9 : 0,
          gasUsed: parseFloat(block.gasUsed.toString()),
          gasLimit: parseFloat(block.gasLimit.toString()),
          erc20TransferVolume: volume,
        };

        // Update state to keep the latest 10 blocks
        setBlocksData(prev => {
          const newData = [...prev, newBlockData];
          if (newData.length > 10) {
            newData.shift();
          }
          return newData;
        });
        console.log("Updated blocksData:", blocksData); // Debugging
      } catch (error) {
        console.error("Handle new block failed:", error);
      }
    };

    provider.on("block", handleNewBlock);

    // Cleanup listener
    return () => {
      provider.off("block", handleNewBlock);
    };
  }, []);

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1>Ethereum Mainnet 实时区块链分析仪表板</h1>

      {/* First chart: ERC20 transfer volume */}
      <div>
        <h2>ERC20 代币转账量 (Token: {TOKEN_ADDRESS.slice(0, 6)}...)</h2>
        <LineChart width={600} height={300} data={blocksData}>
          <XAxis dataKey="blockNumber" />
          <YAxis />
          <CartesianGrid stroke="#eee" />
          <Line type="monotone" dataKey="erc20TransferVolume" stroke="#8884d8" name="转账量" />
          <Tooltip />
          <Legend />
        </LineChart>
      </div>

      {/* Second chart: Base Fee */}
      <div>
        <h2>每区块 BASEFEE (Gwei)</h2>
        <LineChart width={600} height={300} data={blocksData}>
          <XAxis dataKey="blockNumber" />
          <YAxis />
          <CartesianGrid stroke="#eee" />
          <Line type="monotone" dataKey="baseFeePerGas" stroke="#82ca9d" name="BASEFEE" />
          <Tooltip />
          <Legend />
        </LineChart>
      </div>

      {/* Third chart: Gas Used / Gas Limit */}
      <div>
        <h2>Gas Used / Gas Limit (%)</h2>
        <LineChart
          width={600}
          height={300}
          data={blocksData.map(block => ({
            blockNumber: block.blockNumber,
            gasRatio: (block.gasUsed / block.gasLimit) * 100,
          }))}
        >
          <XAxis dataKey="blockNumber" />
          <YAxis />
          <CartesianGrid stroke="#eee" />
          <Line type="monotone" dataKey="gasRatio" stroke="#ffc658" name="Gas 比率" />
          <Tooltip />
          <Legend />
        </LineChart>
      </div>
    </div>
  );
}