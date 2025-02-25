const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GodMode Contract Tests", function () {
  let GodMode, godMode, deployer, user1, user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();
    GodMode = await ethers.getContractFactory("GodMode");
    godMode = await GodMode.deploy("GodToken", "GOD", deployer.address);
    await godMode.waitForDeployment();
  });

  describe("Constructor", function () {
    it("应该正确设置 god 地址", async function () {
      expect(await godMode.god()).to.equal(deployer.address);
    });

    it("应该拒绝零地址作为 god", async function () {
      await expect(
        GodMode.deploy("GodToken", "GOD", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address: zero address");
    });
  });

  describe("mint", function () {
    it("god 可以 mint 代币并更新 totalSupply", async function () {
      await godMode.mint(user1.address, ethers.parseEther("1000"));
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await godMode.totalSupply()).to.equal(ethers.parseEther("1000"));
    });

    it("非 god 调用应该失败", async function () {
      await expect(
        godMode.connect(user1).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Only god can mint tokens");
    });

    it("mint 0 代币应该成功", async function () {
      await godMode.mint(user1.address, 0);
      expect(await godMode.balanceOf(user1.address)).to.equal(0);
      expect(await godMode.totalSupply()).to.equal(0);
    });
  });

  describe("ERC20 Standard Functions", function () {
    beforeEach(async function () {
      await godMode.mint(user1.address, ethers.parseEther("1000"));
    });

    it("transfer 应该成功并触发 Transfer 事件", async function () {
      const tx = await godMode.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
      expect(await godMode.balanceOf(user2.address)).to.equal(ethers.parseEther("500"));

      await expect(tx)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, user2.address, ethers.parseEther("500"));
    });

    it("transfer 余额不足应该失败", async function () {
      await expect(
        godMode.connect(user1).transfer(user2.address, ethers.parseEther("2000"))
      ).to.be.reverted;
    });

    it("transfer 0 代币应该成功", async function () {
      const tx = await godMode.connect(user1).transfer(user2.address, 0);
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await godMode.balanceOf(user2.address)).to.equal(0);

      await expect(tx)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, user2.address, 0);
    });

    it("approve 和 transferFrom 应该成功并触发事件", async function () {
      const tx1 = await godMode.connect(user1).approve(user2.address, ethers.parseEther("500"));
      expect(await godMode.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("500"));

      await expect(tx1)
        .to.emit(godMode, "Approval")
        .withArgs(user1.address, user2.address, ethers.parseEther("500"));

      const tx2 = await godMode.connect(user2).transferFrom(user1.address, user2.address, ethers.parseEther("300"));
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("700"));
      expect(await godMode.balanceOf(user2.address)).to.equal(ethers.parseEther("300"));
      expect(await godMode.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("200"));

      await expect(tx2)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, user2.address, ethers.parseEther("300"));
    });

    it("approve 0 应该成功", async function () {
      const tx = await godMode.connect(user1).approve(user2.address, 0);
      expect(await godMode.allowance(user1.address, user2.address)).to.equal(0);

      await expect(tx)
        .to.emit(godMode, "Approval")
        .withArgs(user1.address, user2.address, 0);
    });

    it("transferFrom 超出授权应该失败", async function () {
      await godMode.connect(user1).approve(user2.address, ethers.parseEther("200"));
      await expect(
        godMode.connect(user2).transferFrom(user1.address, user2.address, ethers.parseEther("300"))
      ).to.be.reverted;
    });

    it("transferFrom 未授权应该失败", async function () {
      await expect(
        godMode.connect(user2).transferFrom(user1.address, user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("transferFrom 0 代币应该成功", async function () {
      await godMode.connect(user1).approve(user2.address, ethers.parseEther("500"));
      const tx = await godMode.connect(user2).transferFrom(user1.address, user2.address, 0);
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await godMode.balanceOf(user2.address)).to.equal(0);
      expect(await godMode.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("500"));

      await expect(tx)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, user2.address, 0);
    });
  });

  describe("sellBack", function () {
    beforeEach(async function () {
      await godMode.mint(user1.address, ethers.parseEther("1000"));
    });

    it("应该成功卖回代币并获得 ETH", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      const amountToSell = ethers.parseEther("500");
      const initialETHBalance = await ethers.provider.getBalance(user1.address);

      const tx = await godMode.connect(user1).sellBack(amountToSell);
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
      const finalETHBalance = await ethers.provider.getBalance(user1.address);
      expect(finalETHBalance).to.be.above(initialETHBalance);
      expect(await godMode.balanceOf(godMode.target)).to.equal(ethers.parseEther("500"));
      expect(await godMode.totalSupply()).to.equal(ethers.parseEther("1000"));
      expect(await ethers.provider.getBalance(godMode.target)).to.equal(ethers.parseEther("0.75"));

      await expect(tx)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, godMode.target, ethers.parseEther("500"));
    });

    it("卖回 0 代币应该成功且不转移 ETH", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      const initialETHBalance = await ethers.provider.getBalance(user1.address);
      const tx = await godMode.connect(user1).sellBack(0);

      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await godMode.balanceOf(godMode.target)).to.equal(0);
      expect(await ethers.provider.getBalance(godMode.target)).to.equal(ethers.parseEther("1"));
      const finalETHBalance = await ethers.provider.getBalance(user1.address);
      expect(finalETHBalance).to.be.below(initialETHBalance); // 只减少 gas 费用

      await expect(tx)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, godMode.target, 0);
    });

    it("如果合约 ETH 不足，应该失败", async function () {
      await expect(
        godMode.connect(user1).sellBack(ethers.parseEther("500"))
      ).to.be.revertedWith("ETH is not enough");
    });

    it("如果用户代币余额不足，应该失败", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      await expect(
        godMode.connect(user1).sellBack(ethers.parseEther("2000"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("如果用户没有代币，应该失败", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      await expect(
        godMode.connect(user2).sellBack(ethers.parseEther("1"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("receive", function () {
    it("合约可以接收 ETH", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });
      expect(await ethers.provider.getBalance(godMode.target)).to.equal(ethers.parseEther("1"));
    });
  });
});