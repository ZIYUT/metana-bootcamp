const hre = require("hardhat");

async function main() {
  try {
    console.log("开始部署到测试网...");
    
    // 检查网络连接
    console.log("检查网络连接...");
    const network = await hre.ethers.provider.getNetwork();
    console.log(`连接到网络: ${network.name} (chainId: ${network.chainId})`);
    
    // 检查账户余额
    const [deployer] = await hre.ethers.getSigners();
    console.log(`使用账户: ${deployer.address}`);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`账户余额: ${hre.ethers.formatEther(balance)} MATIC`);
    
    if (balance === 0n) {
      throw new Error("账户余额为 0，请先充值测试币");
    }
    
    // 在测试网使用的地址
    console.log("设置合约地址...");
    const weth = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // Polygon WETH
    const usdc = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon USDC
    const uniswapPool = "0x45dDa9cb7c25131DF268515131f647d726f50608"; // 示例地址，实际部署时替换
    const sushiswapPair = "0x34965ba0ac2451A34a0471F04CCa3F990b8dea27"; // 示例地址，实际部署时替换
    const uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router
    const sushiswapRouter = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"; // SushiSwap Router
    const lendingPool = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; // AAVE V3 Pool

    // 1. 部署价格库
    console.log("1/3: 部署价格库合约...");
    const PriceLibrary = await hre.ethers.getContractFactory("PriceLibrary");
    const priceLibrary = await PriceLibrary.deploy();
    await priceLibrary.waitForDeployment();
    const priceLibraryAddress = await priceLibrary.getAddress();
    console.log(`价格库合约已部署到: ${priceLibraryAddress}`);
    
    // 2. 部署交换执行器
    console.log("2/3: 部署交换执行器合约...");
    const ArbitrageSwapper = await hre.ethers.getContractFactory("ArbitrageSwapper");
    const arbitrageSwapper = await ArbitrageSwapper.deploy(weth, usdc);
    await arbitrageSwapper.waitForDeployment();
    const swapperAddress = await arbitrageSwapper.getAddress();
    console.log(`交换执行器合约已部署到: ${swapperAddress}`);
    
    // 3. 部署主执行合约，链接库
    console.log("3/3: 部署主执行合约...");
    
    // 设置库链接
    const libraries = {
      "PriceLibrary": priceLibraryAddress
    };
    
    const ArbitrageExecutor = await hre.ethers.getContractFactory("ArbitrageExecutor", {
      libraries: libraries
    });
    
    const arbitrageExecutor = await ArbitrageExecutor.deploy(
      weth,
      usdc,
      uniswapPool,
      sushiswapPair,
      uniswapRouter,
      sushiswapRouter,
      lendingPool,
      swapperAddress
    );
    
    await arbitrageExecutor.waitForDeployment();
    const executorAddress = await arbitrageExecutor.getAddress();
    console.log(`主执行合约已部署到: ${executorAddress}`);
    
    console.log("所有合约部署完成！");
  } catch (error) {
    console.error("部署失败:", error.message);
  }
}

main().catch(error => console.error(error));