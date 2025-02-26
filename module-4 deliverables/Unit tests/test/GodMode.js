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
    it("Should correctly set the god address", async function () {
      expect(await godMode.god()).to.equal(deployer.address);
    });

    it("Should reject zero address as god", async function () {
      await expect(
        GodMode.deploy("GodToken", "GOD", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address: zero address");
    });
  });

  describe("mint", function () {
    it("God can mint tokens and update totalSupply", async function () {
      await godMode.mint(user1.address, ethers.parseEther("1000"));
      expect(await godMode.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await godMode.totalSupply()).to.equal(ethers.parseEther("1000"));
    });

    it("Non-god caller should fail", async function () {
      await expect(
        godMode.connect(user1).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Only god can mint tokens");
    });

    it("Minting 0 tokens should succeed", async function () {
      await godMode.mint(user1.address, 0);
      expect(await godMode.balanceOf(user1.address)).to.equal(0);
      expect(await godMode.totalSupply()).to.equal(0);
    });
  });

  describe("sellBack", function () {
    beforeEach(async function () {
      await godMode.mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should successfully sell back tokens and receive ETH", async function () {
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

    it("Selling back 0 tokens should succeed without transferring ETH", async function () {
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
      expect(finalETHBalance).to.be.below(initialETHBalance); // Only gas fees deducted

      await expect(tx)
        .to.emit(godMode, "Transfer")
        .withArgs(user1.address, godMode.target, 0);
    });

    it("Should fail if contract has insufficient ETH", async function () {
      await expect(
        godMode.connect(user1).sellBack(ethers.parseEther("500"))
      ).to.be.revertedWith("ETH is not enough");
    });

    it("Should fail if user has insufficient token balance", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });

      await expect(
        godMode.connect(user1).sellBack(ethers.parseEther("2000"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("receive", function () {
    it("Contract can receive ETH", async function () {
      await deployer.sendTransaction({
        to: godMode.target,
        value: ethers.parseEther("1"),
      });
      expect(await ethers.provider.getBalance(godMode.target)).to.equal(ethers.parseEther("1"));
    });
  });
});