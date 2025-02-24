const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GodMode 合约 - 部分退款", function () {
  let godMode, owner, user;
  const TOKEN_AMOUNT = 1000 * 10 ** 18;  // 示例代币数量
  const ETH_AMOUNT = ethers.utils.parseEther("0.5"); // 1000代币换0.5 ETH

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // 部署GodMode合约
    const GodMode = await ethers.getContractFactory("GodMode");
    godMode = await GodMode.deploy("GodModeToken", "GMT", owner.address);
    await godMode.deployed();

    // 给用户铸造一些代币
    await godMode.mintTokensToAddress(user.address, TOKEN_AMOUNT);
    await godMode.depositETH({ value: ETH_AMOUNT });
  });

  it("应该成功卖回代币并转账ETH给用户", async () => {
    // 用户卖回1000个代币
    const initialBalance = await ethers.provider.getBalance(user.address);
    await expect(godMode.connect(user).sellBack(TOKEN_AMOUNT))
      .to.emit(godMode, "Transfer")
      .withArgs(user.address, godMode.address, TOKEN_AMOUNT);

    const finalBalance = await ethers.provider.getBalance(user.address);
    const expectedBalance = initialBalance.add(ETH_AMOUNT);

    expect(finalBalance).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.0001"));
  });

  it("如果合约没有足够的ETH，应该回滚", async () => {
    // 模拟合约没有足够的ETH
    await godMode.connect(owner).withdrawETH();  // 提取合约内所有ETH

    await expect(godMode.connect(user).sellBack(TOKEN_AMOUNT))
      .to.be.revertedWith("ETH is not enough");
  });

  it("如果用户没有足够的代币，应该回滚", async () => {
    // 用户尝试卖回比拥有的代币还多的数量
    const userBalance = await godMode.balanceOf(user.address);
    await expect(godMode.connect(user).sellBack(userBalance.add(1)))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
});
