const { ethers } = require("hardhat");

async function main() {
  console.log("开始部署套利合约到 Polygon 主网...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`使用账户: ${deployer.address}`);

  // 检查账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`账户余额: ${ethers.formatEther(balance)} MATIC`);
  
  if (ethers.formatEther(balance) < 0.5) {
    console.warn("警告: 账户余额低于0.5 MATIC，可能不足以完成部署");
  }

  // Polygon上的地址常量
  const ADDRESSES = {
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    UNISWAP_ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    SUSHISWAP_ROUTER: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    LENDING_POOL: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3
    UNISWAP_POOL: "0x45dDa9cb7c25131DF268515131f647d726f50608", // WETH-USDC 0.3%
    SUSHISWAP_PAIR: "0x34965ba0ac2451A34a0471F04CCa3F990b8dea27" // SushiSwap WETH-USDC
  };

  try {
    // 1. 部署 PriceLibrary 库
    console.log("\n1. 部署 PriceLibrary 库...");
    const PriceLibrary = await ethers.getContractFactory("PriceLibrary");
    const priceLibrary = await PriceLibrary.deploy();
    await priceLibrary.waitForDeployment();
    const priceLibraryAddress = await priceLibrary.getAddress();
    console.log(`✅ PriceLibrary 已部署到: ${priceLibraryAddress}`);

    // 2. 部署 ArbitrageSwapper
    console.log("\n2. 部署 ArbitrageSwapper...");
    const ArbitrageSwapper = await ethers.getContractFactory("ArbitrageSwapper");
    const swapper = await ArbitrageSwapper.deploy(
      ADDRESSES.WETH,
      ADDRESSES.USDC
    );
    await swapper.waitForDeployment();
    const swapperAddress = await swapper.getAddress();
    console.log(`✅ ArbitrageSwapper 已部署到: ${swapperAddress}`);

    // 3. 部署 ArbitrageExecutor
    console.log("\n3. 部署 ArbitrageExecutor...");
    const ArbitrageExecutor = await ethers.getContractFactory("ArbitrageExecutor", {
      libraries: {
        PriceLibrary: priceLibraryAddress
      }
    });
    
    const executor = await ArbitrageExecutor.deploy(
      ADDRESSES.UNISWAP_POOL,
      ADDRESSES.SUSHISWAP_PAIR,
      swapperAddress
    );
    
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    console.log(`✅ ArbitrageExecutor 已部署到: ${executorAddress}`);

    // 4. 设置初始参数
    console.log("\n4. 配置初始参数...");
    await executor.updateParameters(
      ethers.parseEther("0.001"), // 最小利润 0.001 ETH
      20,                         // 最小价格差异 0.2%
      ethers.parseEther("5")      // 最大闪电贷金额 5 ETH (初始保守设置)
    );
    console.log("✅ 初始参数已设置");

    // 5. 验证合约
    console.log("\n5. 验证合约...");
    console.log("等待 30 秒让区块浏览器同步...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: priceLibraryAddress,
        constructorArguments: [],
      });
      console.log("✅ PriceLibrary 已验证");
    } catch (error) {
      console.log("❌ PriceLibrary 验证失败:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: swapperAddress,
        constructorArguments: [ADDRESSES.WETH, ADDRESSES.USDC],
      });
      console.log("✅ ArbitrageSwapper 已验证");
    } catch (error) {
      console.log("❌ ArbitrageSwapper 验证失败:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: executorAddress,
        constructorArguments: [
          ADDRESSES.UNISWAP_POOL,
          ADDRESSES.SUSHISWAP_PAIR,
          swapperAddress
        ],
        libraries: {
          PriceLibrary: priceLibraryAddress
        }
      });
      console.log("✅ ArbitrageExecutor 已验证");
    } catch (error) {
      console.log("❌ ArbitrageExecutor 验证失败:", error.message);
    }

    // 汇总部署信息
    console.log("\n🎉 部署完成! 合约地址汇总:");
    console.log(`- PriceLibrary: ${priceLibraryAddress}`);
    console.log(`- ArbitrageSwapper: ${swapperAddress}`);
    console.log(`- ArbitrageExecutor: ${executorAddress}`);
    console.log("\n下一步: 在Chainlink Automation上注册合约");

  } catch (error) {
    console.error("❌ 部署失败:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });