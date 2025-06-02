require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require('@nomicfoundation/hardhat-verify');
require("@nomicfoundation/hardhat-ethers");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!PRIVATE_KEY || !ALCHEMY_API_KEY) {
  console.error("请在 .env 文件中设置 PRIVATE_KEY 和 ALCHEMY_API_KEY");
  process.exit(1);
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.5.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        // 可选：固定块高度，为了测试结果一致性
        // blockNumber: 18500000
      }
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      // 修改 gas 设置
      gasPrice: undefined,
      // 降低 gas 上限
      maxFeePerGas: 30000000000, // 降至 30 Gwei
      maxPriorityFeePerGas: 25000000000, // 刚好满足最低 25 Gwei
      timeout: 120000,
      httpHeaders: { 'Connection': 'keep-alive' },
    },
    // Polygon主网配置
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: "auto",
      gasMultiplier: 1.2
    },
    // Sepolia测试网 (以太坊测试网)
    sepolia: {
      url: `https://polygon-amoy.g.alchemy.com/v2/CnxPrI9slboojxKgzYFjtY0wi-AzpVvh`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
    // Mumbai测试网 (Polygon测试网)
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 80001
    },
    // 添加 Polygon Mainnet Fork 配置
    polygonFork: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/CnxPrI9slboojxKgzYFjtY0wi-AzpVvh`,
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/CnxPrI9slboojxKgzYFjtY0wi-AzpVvh`,
        blockNumber: 53111000 // 可选：指定一个区块高度进行分叉
      },
      chainId: 137
    }
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygonAmoy: process.env.ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  }
};