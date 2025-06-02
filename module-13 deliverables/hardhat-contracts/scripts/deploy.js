const { ethers } = require("hardhat");

async function main() {
    // 部署 PriceLibrary
    const PriceLibrary = await ethers.getContractFactory("PriceLibrary");
    const priceLibrary = await PriceLibrary.deploy();
    await priceLibrary.waitForDeployment();
    console.log("PriceLibrary deployed to:", await priceLibrary.getAddress());

    // 部署 ArbitrageSwapper
    const ArbitrageSwapper = await ethers.getContractFactory("ArbitrageSwapper");
    const swapper = await ArbitrageSwapper.deploy();
    await swapper.waitForDeployment();
    console.log("ArbitrageSwapper deployed to:", await swapper.getAddress());

    // 部署 ArbitrageExecutor
    const ArbitrageExecutor = await ethers.getContractFactory("ArbitrageExecutor");
    const executor = await ArbitrageExecutor.deploy(
        "0x7BdEE067d1C5Bf1D5Dd4Dd2D2B5B5B5B5B5B5B5B5", // Uniswap V3 Pool address
        "0x7BdEE067d1C5Bf1D5Dd4Dd2D2B5B5B5B5B5B5B5B5", // SushiSwap Pair address
        await swapper.getAddress()
    );
    await executor.waitForDeployment();
    console.log("ArbitrageExecutor deployed to:", await executor.getAddress());

    // 等待几个区块确认
    console.log("Waiting for block confirmations...");
    await executor.deployTransaction.wait(5);
    console.log("Deployment completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 