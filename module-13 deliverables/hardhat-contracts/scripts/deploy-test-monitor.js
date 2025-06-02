const { ethers } = require("hardhat");

async function main() {
  console.log("部署测试网监控合约...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`使用账户: ${deployer.address}`);

  // 为测试网更新地址
  const ADDRESSES = {
    // Mumbai测试网地址示例
    UNISWAP_POOL: "0x5dd88702fcba19c6f88e7063d2ec73bb51a4a0e5", // Mumbai上的随机池
    SUSHISWAP_PAIR: "0x4b1f1e2435a9c96f7330faea190ef6a7c8d70001"  // 另一个随机池
    
    // 或者可以使用同一个池子地址两次（仅作测试用）
  };

  // 1. 部署 PriceLibrary 库
  console.log("\n1. 部署 PriceLibrary 库...");
  const PriceLibrary = await ethers.getContractFactory("PriceLibrary");
  const priceLibrary = await PriceLibrary.deploy();
  await priceLibrary.waitForDeployment();
  const priceLibraryAddress = await priceLibrary.getAddress();
  console.log(`✅ PriceLibrary 已部署到: ${priceLibraryAddress}`);

  // 2. 部署测试监控合约
  console.log("\n2. 部署 TestArbitrageMonitor...");
  const TestArbitrageMonitor = await ethers.getContractFactory("TestArbitrageMonitor", {
    libraries: {
      PriceLibrary: priceLibraryAddress
    }
  });
  
  const monitor = await TestArbitrageMonitor.deploy(
    ADDRESSES.UNISWAP_POOL,
    ADDRESSES.SUSHISWAP_PAIR,
    20 // 0.2% 价格差异
  );
  
  await monitor.waitForDeployment();
  const monitorAddress = await monitor.getAddress();
  console.log(`✅ TestArbitrageMonitor 已部署到: ${monitorAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });