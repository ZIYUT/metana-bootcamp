const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GodMode - Partial Refund Tests", function () {
  let GodMode, godMode, owner, addr1;

  // 在每个测试之前部署合约
  beforeEach(async function () {
    // 获取签名者（账户）
    [owner, addr1] = await ethers.getSigners();

    // 部署 GodMode 合约
    GodMode = await ethers.getContractFactory("GodMode");
    godMode = await GodMode.deploy("GodToken", "GOD", owner.address);
    await godMode.waitForDeployment();
  });

  describe("sellBack", function () {
    it("应该成功卖回代币并获得 ETH", async function () {
      // 给 addr1 mint 一些代币
      await godMode.mintTokensToAddress(addr1.address, ethers.parseEther("1000"));

      // 向合约发送一些 ETH（模拟有足够的 ETH 用于退款）
      await owner.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      // addr1 卖回 500 个代币
      const amountToSell = ethers.parseEther("500");
      const initialETHBalance = await ethers.provider.getBalance(addr1.address);

      const tx = await godMode.connect(addr1).sellBack(amountToSell);
      const receipt = await tx.wait();

      // 检查代币余额减少
      expect(await godMode.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));

      // 检查 ETH 余额增加（减去 gas 费用后）
      const finalETHBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalETHBalance).to.be.above(initialETHBalance);
    });

    it("如果合约 ETH 不足，应该失败", async function () {
      // 给 addr1 mint 一些代币
      await godMode.mintTokensToAddress(addr1.address, ethers.parseEther("1000"));

      // 不向合约发送 ETH，确保余额为 0
      const amountToSell = ethers.parseEther("500");

      // 期望交易 revert 并带有特定错误信息
      await expect(
        godMode.connect(addr1).sellBack(amountToSell)
      ).to.be.revertedWith("ETH is not enough");
    });

    it("如果用户代币余额不足，应该失败", async function () {
      // 给 addr1 mint 少量代币（少于要卖的数量）
      await godMode.mintTokensToAddress(addr1.address, ethers.parseEther("100"));

      // 向合约发送足够的 ETH
      await owner.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      // 尝试卖回 500 个代币（超过余额）
      const amountToSell = ethers.parseEther("500");

      // 期望交易 revert 并带有特定错误信息
      await expect(
        godMode.connect(addr1).sellBack(amountToSell)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });
});