const { ethers } = require("hardhat");

async function main() {
  console.log("开始测试套利合约执行...");

  // 合约地址
  const ADDRESSES = {
    ARBITRAGE_EXECUTOR: "0x1Ee0ed169F15436F1173a9652606391cf70d7d71",
    PRICE_LIBRARY: "0xC21593BD41e1e4BC96A785D443F650a7776BB328",
    SWAPPER: "0x7B31e111C5fCAe0f099F396a7C7711E1780351Ae"
  };

  try {
    // 连接账户
    const [signer] = await ethers.getSigners();
    console.log(`使用账户: ${signer.address}`);
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`账户余额: ${ethers.formatEther(balance)} POL`); // 已修改为POL

    // 1. 加载已部署的合约
    console.log("\n1. 连接已部署合约...");
    const executor = await ethers.getContractAt(
      "ArbitrageExecutor",
      ADDRESSES.ARBITRAGE_EXECUTOR,
      signer
    );
    console.log("✅ 已连接套利执行器合约");

    // 2. 检查当前参数设置
    console.log("\n2. 检查合约参数...");
    const minProfitAmount = await executor.minProfitAmount();
    const minPriceDeviation = await executor.minPriceDeviation();
    const maxFlashLoanAmount = await executor.maxFlashLoanAmount();
    
    console.log(`最小利润要求: ${ethers.formatEther(minProfitAmount)} ETH`);
    console.log(`最小价格偏差: ${Number(minPriceDeviation) / 100}%`);
    console.log(`最大闪电贷金额: ${ethers.formatEther(maxFlashLoanAmount)} ETH`);

    // 3. 检查是否存在套利机会
    console.log("\n3. 检查是否存在套利机会...");
    const [upkeepNeeded, performData] = await executor.checkUpkeep("0x");
    console.log(`当前是否存在套利机会: ${upkeepNeeded}`);

    if (upkeepNeeded) {
      // 4. 执行套利
      console.log("\n4. 发现套利机会! 准备执行套利...");
      
      // 获取当前价格信息
      console.log("获取当前价格信息...");
      try {
        // 尝试获取价格信息 - 如果有这些函数的话
        const PriceLibrary = await ethers.getContractAt(
          "PriceLibrary", 
          ADDRESSES.PRICE_LIBRARY
        );
        
        const uniswapPool = await executor.uniswapPool();
        const sushiswapPair = await executor.sushiswapPair();
        
        const prices = await PriceLibrary.getCurrentPrices(uniswapPool, sushiswapPair);
        console.log(`Uniswap价格: ${ethers.formatUnits(prices[0], 18)} USDC/ETH`);
        console.log(`Sushiswap价格: ${ethers.formatUnits(prices[1], 18)} USDC/ETH`);
      } catch (error) {
        console.log("无法直接获取价格，继续执行套利...");
      }
      
      // 预估可能的利润
      console.log("\n预估可能的套利结果:");
      try {
        const profitEstimate = await executor.simulateArbitrage();
        console.log(`预估利润: ${ethers.formatEther(profitEstimate)} ETH`);
      } catch (error) {
        console.log("无法估算利润，将直接执行套利");
      }

      // 执行套利交易
      console.log("\n提交套利交易...");
      console.log("请注意: 这将是一个实际的链上交易，需要支付gas费");
      
      // 定义是否执行交易
      const confirmExecution = true; // 在这里定义变量！
      
      try {
        const gasEstimate = await executor.estimateGas.performUpkeep(performData, {
          gasLimit: 5000000
        });
        console.log(`预估gas消耗: ${gasEstimate.toString()}`);
      } catch (error) {
        console.log(`无法估算gas: ${error.message}`);
      }
      
      if (confirmExecution) {
        try {
          console.log("\n执行套利交易...");
          const tx = await executor.performUpkeep(performData, {
            gasLimit: 3500000
          });
          
          console.log(`交易已提交，等待确认...`);
          console.log(`交易哈希: ${tx.hash}`);
          
          // 等待交易确认
          const receipt = await tx.wait();
          console.log(`\n交易已确认! 区块号: ${receipt.blockNumber}`);
          console.log(`Gas使用: ${receipt.gasUsed.toString()}`);
          
          // 检查套利后结果
          const profits = await executor.totalProfits();
          console.log(`\n合约总利润: ${ethers.formatEther(profits)} ETH`);
        } catch (error) {
          console.error(`\n执行交易失败: ${error.message}`);
          // 输出更多错误信息以便诊断
          if (error.data) console.error("错误数据:", error.data);
          if (error.transaction) console.error("交易详情:", error.transaction);
        }
      } else {
        console.log("\n已跳过实际交易执行。");
      }
    } else {
      console.log("\n当前没有套利机会，尝试以下操作：");
      console.log("1. 检查当前 Uniswap 和 SushiSwap 间的价格差异");
      console.log("2. 降低 minPriceDeviation 参数");
      console.log("3. 等待市场波动创造更大的价差");
      
      // 显示当前价格以供参考 - 使用正确的函数调用
      try {
        // 使用正确的库和地址调用
        const PriceLibrary = await ethers.getContractAt(
          "PriceLibrary", 
          ADDRESSES.PRICE_LIBRARY
        );
        
        // 获取池地址
        const uniswapPool = await executor.uniswapPool();
        const sushiswapPair = await executor.sushiswapPair();
        
        // 尝试直接调用库方法
        const prices = await PriceLibrary.getCurrentPrices(uniswapPool, sushiswapPair);
        const uniswapPrice = prices[0];
        const sushiswapPrice = prices[1];
        
        console.log(`\n当前 Uniswap价格: ${ethers.formatUnits(uniswapPrice, 18)} USDC/ETH`);
        console.log(`当前 Sushiswap价格: ${ethers.formatUnits(sushiswapPrice, 18)} USDC/ETH`);
        
        // 计算价差百分比
        const uniPrice = Number(ethers.formatUnits(uniswapPrice, 18));
        const sushiPrice = Number(ethers.formatUnits(sushiswapPrice, 18));
        const priceDiff = Math.abs((uniPrice - sushiPrice) / Math.min(uniPrice, sushiPrice) * 100);
        
        console.log(`价格差异: ${priceDiff.toFixed(4)}%`);
        console.log(`当前最小差异要求: ${Number(minPriceDeviation) / 100}%`);
      } catch (error) {
        console.log(`无法获取当前价格信息: ${error.message}`);
        console.log("您可以尝试通过合约调用读取价格或降低参数阈值");
      }
    }

  } catch (error) {
    console.error("❌ 测试过程中出错:", error);
    if (error.data) {
      console.error("错误数据:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });