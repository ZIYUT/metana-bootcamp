const { ethers } = require("hardhat");

async function main() {
    // 合约地址
    const ARBITRAGE_EXECUTOR = "0x170Bad9cF24704471CA56D9a6155b5f4AC972B7E";
    const PRICE_LIBRARY = "0x69001cB0CB2427Fa23E979d39F474f81A9822194";
    const UNISWAP_POOL = "0x45dDa9cb7c25131DF268515131f647d726f50608";
    const SUSHISWAP_PAIR = "0x34965ba0ac2451A34a0471F04CCa3F990b8dea27";

    // 获取合约实例
    const executor = await ethers.getContractAt("ArbitrageExecutor", ARBITRAGE_EXECUTOR);
    const priceLibrary = await ethers.getContractAt("PriceLibrary", PRICE_LIBRARY);

    // 更新最小价差参数
    console.log("更新最小价差参数...");
    try {
        const tx = await executor.updateParameters(
            ethers.parseEther("0.001"), // minProfitAmount 保持不变
            10,                         // minPriceDeviation 改为 10 (0.1%)
            ethers.parseEther("100")    // maxFlashLoanAmount 保持不变
        );
        console.log("更新参数交易已发送:", tx.hash);
        await tx.wait();
        console.log("参数更新成功！");
    } catch (error) {
        console.log("更新参数失败:", error.message);
    }

    // 获取参数
    const minPriceDeviation = await executor.minPriceDeviation();
    const minExecutionInterval = await executor.minExecutionInterval();
    const lastExecutionTimestamp = await executor.lastExecutionTimestamp();

    // 获取当前价格
    const [uniswapPrice, sushiswapPrice] = await priceLibrary.getCurrentPrices.staticCall(
        UNISWAP_POOL,
        SUSHISWAP_PAIR
    );

    // 计算价格差异
    const [priceDiff, firstHigher] = await priceLibrary.calculatePriceDifference.staticCall(
        uniswapPrice,
        sushiswapPrice
    );

    // 获取当前时间
    const now = Math.floor(Date.now() / 1000);

    // 判断每个条件
    let reason = [];
    if (uniswapPrice.toString() === "0" || sushiswapPrice.toString() === "0") {
        reason.push("价格数据无效");
    }
    if (BigInt(priceDiff) < BigInt(minPriceDeviation)) {
        reason.push(`价差不足（当前: ${priceDiff.toString()}，要求: ${minPriceDeviation.toString()}）`);
    }
    if (BigInt(now) < BigInt(lastExecutionTimestamp) + BigInt(minExecutionInterval)) {
        const remain = Number(BigInt(lastExecutionTimestamp) + BigInt(minExecutionInterval) - BigInt(now));
        reason.push(`距离上次执行时间太短（还需等待 ${remain} 秒）`);
    }

    // 输出信息
    console.log("\n当前价格:");
    console.log("- Uniswap:", ethers.formatUnits(uniswapPrice, 6), "USDC");
    console.log("- SushiSwap:", ethers.formatUnits(sushiswapPrice, 6), "USDC");
    console.log("价格差异:", priceDiff.toString(), "basis points");
    console.log("Uniswap价格", firstHigher ? "更高" : "更低");

    if (reason.length === 0) {
        console.log("\n满足所有条件，可以进行套利！");
        
        // 调用 checkUpkeep 确认
        const [upkeepNeeded, performData] = await executor.checkUpkeep.staticCall("0x");
        
        if (upkeepNeeded) {
            console.log("执行套利...");
            
            try {
                // 先尝试估算 gas
                const gasEstimate = await executor.performUpkeep.estimateGas(performData);
                console.log("Gas 估算成功:", gasEstimate.toString());

                // 执行套利
                const tx = await executor.performUpkeep(performData);
                console.log("交易已发送:", tx.hash);
                
                // 等待交易确认
                const receipt = await tx.wait();
                console.log("交易已确认，区块号:", receipt.blockNumber);
                
                // 查找 ArbitrageExecuted 事件
                const event = receipt.logs.find(
                    log => {
                        try {
                            const parsedLog = executor.interface.parseLog(log);
                            return parsedLog.name === "ArbitrageExecuted";
                        } catch (e) {
                            return false;
                        }
                    }
                );
                
                if (event) {
                    const parsedLog = executor.interface.parseLog(event);
                    console.log("套利执行结果:");
                    console.log("- 利润:", ethers.formatEther(parsedLog.args.profit), "ETH");
                    console.log("- 方向:", parsedLog.args.uniswapToSushi ? "Uniswap -> SushiSwap" : "SushiSwap -> Uniswap");
                }
            } catch (error) {
                console.log("\n交易执行失败，详细错误信息：");
                
                // 尝试解析错误信息
                if (error.data) {
                    try {
                        const decodedError = executor.interface.parseError(error.data);
                        console.log("合约错误:", decodedError.name);
                        console.log("错误参数:", decodedError.args);
                    } catch (e) {
                        console.log("原始错误数据:", error.data);
                    }
                }
                
                // 检查是否是 gas 估算失败
                if (error.message.includes("execution reverted")) {
                    console.log("交易被 revert，可能原因：");
                    console.log("1. Flash loan 归还失败");
                    console.log("2. 代币授权不足");
                    console.log("3. 合约余额不足");
                    console.log("4. 套利操作失败");
                }
                
                // 输出完整错误信息
                console.log("\n完整错误信息:", error.message);
            }
        } else {
            console.log("虽然本地检查通过，但链上 checkUpkeep 返回 false，可能原因：");
            console.log("1. 价格在检查期间发生变化");
            console.log("2. 其他合约状态发生变化");
        }
    } else {
        console.log("\n未进行套利，原因如下：");
        reason.forEach((r, i) => console.log(`${i + 1}. ${r}`));
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });