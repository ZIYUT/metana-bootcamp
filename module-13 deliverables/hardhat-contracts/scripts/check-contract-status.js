const { ethers } = require("hardhat");

async function main() {
    // 合约地址
    const ARBITRAGE_EXECUTOR = "0x170Bad9cF24704471CA56D9a6155b5f4AC972B7E";
    const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
    const LENDING_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
    const UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

    // 获取合约实例
    const executor = await ethers.getContractAt("ArbitrageExecutor", ARBITRAGE_EXECUTOR);
    const weth = await ethers.getContractAt("IERC20", WETH);

    console.log("=== 合约状态检查 ===\n");

    // 1. 检查合约参数
    const minPriceDeviation = await executor.minPriceDeviation();
    const minProfitAmount = await executor.minProfitAmount();
    const maxFlashLoanAmount = await executor.maxFlashLoanAmount();
    const minExecutionInterval = await executor.minExecutionInterval();
    const lastExecutionTimestamp = await executor.lastExecutionTimestamp();

    console.log("合约参数:");
    console.log("- 最小价差:", minPriceDeviation.toString(), "basis points");
    console.log("- 最小利润:", ethers.formatEther(minProfitAmount), "ETH");
    console.log("- 最大闪电贷金额:", ethers.formatEther(maxFlashLoanAmount), "ETH");
    console.log("- 最小执行间隔:", minExecutionInterval.toString(), "秒");
    console.log("- 上次执行时间:", new Date(Number(lastExecutionTimestamp) * 1000).toLocaleString());
    console.log("- 距离下次可执行还有:", Math.max(0, Number(lastExecutionTimestamp) + Number(minExecutionInterval) - Math.floor(Date.now() / 1000)), "秒\n");

    // 2. 检查 WETH 余额
    const balance = await weth.balanceOf(ARBITRAGE_EXECUTOR);
    console.log("WETH 余额:", ethers.formatEther(balance), "WETH\n");

    // 3. 检查授权状态
    const lendingPoolAllowance = await weth.allowance(ARBITRAGE_EXECUTOR, LENDING_POOL);
    const uniswapAllowance = await weth.allowance(ARBITRAGE_EXECUTOR, UNISWAP_ROUTER);
    const sushiswapAllowance = await weth.allowance(ARBITRAGE_EXECUTOR, SUSHISWAP_ROUTER);

    console.log("授权状态:");
    console.log("- Lending Pool 授权:", ethers.formatEther(lendingPoolAllowance), "WETH");
    console.log("- Uniswap Router 授权:", ethers.formatEther(uniswapAllowance), "WETH");
    console.log("- SushiSwap Router 授权:", ethers.formatEther(sushiswapAllowance), "WETH\n");

    // 4. 检查合约统计
    const totalProfits = await executor.totalProfits();
    const executedArbitrages = await executor.executedArbitrages();

    console.log("合约统计:");
    console.log("- 总利润:", ethers.formatEther(totalProfits), "ETH");
    console.log("- 执行次数:", executedArbitrages.toString(), "次\n");

    // 5. 检查当前价格
    const priceLibrary = await ethers.getContractAt("PriceLibrary", await executor.PRICE_LIBRARY());
    const [uniswapPrice, sushiswapPrice] = await priceLibrary.getCurrentPrices.staticCall(
        await executor.uniswapPool(),
        await executor.sushiswapPair()
    );
    const [priceDiff, firstHigher] = await priceLibrary.calculatePriceDifference.staticCall(
        uniswapPrice,
        sushiswapPrice
    );

    console.log("当前价格:");
    console.log("- Uniswap:", ethers.formatUnits(uniswapPrice, 6), "USDC");
    console.log("- SushiSwap:", ethers.formatUnits(sushiswapPrice, 6), "USDC");
    console.log("- 价差:", priceDiff.toString(), "basis points");
    console.log("- Uniswap价格", firstHigher ? "更高" : "更低\n");

    // 6. 检查是否需要授权
    if (lendingPoolAllowance.eq(0) || uniswapAllowance.eq(0) || sushiswapAllowance.eq(0)) {
        console.log("需要更新授权！");
        console.log("请调用合约的 approveTokens 函数进行授权。");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 