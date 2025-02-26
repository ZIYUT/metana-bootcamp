const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC1155Token Contract Tests", function () {
  let ERC1155Token, erc1155Token, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ERC1155Token = await ethers.getContractFactory("ERC1155Token");
    erc1155Token = await ERC1155Token.deploy();
    await erc1155Token.waitForDeployment();
  });

  describe("Constructor", function () {
    it("Should set the owner correctly", async function () {
      expect(await erc1155Token.owner()).to.equal(owner.address);
    });

    it("Should set the URI correctly", async function () {
      expect(await erc1155Token.uri(0)).to.equal("https://api.example.com/api/token/{id}.json");
    });
  });

  describe("mintToken0", function () {
    it("Should mint token 0 successfully", async function () {
      await erc1155Token.connect(user1).mintToken0();
      expect(await erc1155Token.balanceOf(user1.address, 0)).to.equal(1);
      expect(await erc1155Token.lastMintTime(user1.address)).to.equal(await ethers.provider.getBlock("latest").then(b => b.timestamp));
    });

    it("Should fail if called within 3-second cooldown", async function () {
      await erc1155Token.connect(user1).mintToken0();
      await expect(
        erc1155Token.connect(user1).mintToken0()
      ).to.be.revertedWith("Cooldown: Try again in 3 seconds");
    });

    it("Should succeed after 3-second cooldown", async function () {
      await erc1155Token.connect(user1).mintToken0();
      await ethers.provider.send("evm_increaseTime", [3]); // Fast forward 3 seconds
      await ethers.provider.send("evm_mine"); // Mine a new block
      await erc1155Token.connect(user1).mintToken0();
      expect(await erc1155Token.balanceOf(user1.address, 0)).to.equal(2);
    });
  });

  describe("mintToken1", function () {
    it("Should mint token 1 successfully", async function () {
      await erc1155Token.connect(user1).mintToken1();
      expect(await erc1155Token.balanceOf(user1.address, 1)).to.equal(1);
    });

    it("Should fail if called within 3-second cooldown", async function () {
      await erc1155Token.connect(user1).mintToken1();
      await expect(
        erc1155Token.connect(user1).mintToken1()
      ).to.be.revertedWith("Cooldown: Try again in 3 seconds");
    });
  });

  describe("mintToken2", function () {
    it("Should mint token 2 successfully", async function () {
      await erc1155Token.connect(user1).mintToken2();
      expect(await erc1155Token.balanceOf(user1.address, 2)).to.equal(1);
    });

    it("Should fail if called within 3-second cooldown", async function () {
      await erc1155Token.connect(user1).mintToken2();
      await expect(
        erc1155Token.connect(user1).mintToken2()
      ).to.be.revertedWith("Cooldown: Try again in 3 seconds");
    });
  });

  describe("mintToken3", function () {
    beforeEach(async function () {
      await erc1155Token.connect(user1).mintToken0();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user1).mintToken1();
    });

    it("Should mint token 3 by burning token 0 and 1", async function () {
      await erc1155Token.connect(user1).mintToken3();
      expect(await erc1155Token.balanceOf(user1.address, 0)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 1)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 3)).to.equal(1);
    });

    it("Should fail if insufficient token 0", async function () {
      await erc1155Token.connect(user1).mintToken3(); // Burn token 0
      await expect(
        erc1155Token.connect(user1).mintToken3()
      ).to.be.revertedWith("Insufficient token 0 to mint token 3");
    });

    it("Should fail if insufficient token 1", async function () {
      await erc1155Token.connect(user2).mintToken0();
      await expect(
        erc1155Token.connect(user2).mintToken3()
      ).to.be.revertedWith("Insufficient token 1 to mint token 3");
    });
  });

  describe("mintToken4", function () {
    beforeEach(async function () {
      await erc1155Token.connect(user1).mintToken1();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user1).mintToken2();
    });

    it("Should mint token 4 by burning token 1 and 2", async function () {
      await erc1155Token.connect(user1).mintToken4();
      expect(await erc1155Token.balanceOf(user1.address, 1)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 2)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 4)).to.equal(1);
    });

    it("Should fail if insufficient token 1", async function () {
      await erc1155Token.connect(user1).mintToken4(); // Burn token 1
      await expect(
        erc1155Token.connect(user1).mintToken4()
      ).to.be.revertedWith("Insufficient token 1 to mint token 4");
    });

    it("Should fail if insufficient token 2", async function () {
      await erc1155Token.connect(user2).mintToken1();
      await expect(
        erc1155Token.connect(user2).mintToken4()
      ).to.be.revertedWith("Insufficient token 2 to mint token 4");
    });
  });

  describe("mintToken5", function () {
    beforeEach(async function () {
      await erc1155Token.connect(user1).mintToken0();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user1).mintToken2();
    });

    it("Should mint token 5 by burning token 0 and 2", async function () {
      await erc1155Token.connect(user1).mintToken5();
      expect(await erc1155Token.balanceOf(user1.address, 0)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 2)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 5)).to.equal(1);
    });

    it("Should fail if insufficient token 0", async function () {
      await erc1155Token.connect(user1).mintToken5(); // Burn token 0
      await expect(
        erc1155Token.connect(user1).mintToken5()
      ).to.be.revertedWith("Insufficient token 0 to mint token 5");
    });

    it("Should fail if insufficient token 2", async function () {
      await erc1155Token.connect(user2).mintToken0();
      await expect(
        erc1155Token.connect(user2).mintToken5()
      ).to.be.revertedWith("Insufficient token 2 to mint token 5");
    });
  });

  describe("mintToken6", function () {
    beforeEach(async function () {
      await erc1155Token.connect(user1).mintToken0();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user1).mintToken1();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user1).mintToken2();
    });

    it("Should mint token 6 by burning token 0, 1, and 2", async function () {
      await erc1155Token.connect(user1).mintToken6();
      expect(await erc1155Token.balanceOf(user1.address, 0)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 1)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 2)).to.equal(0);
      expect(await erc1155Token.balanceOf(user1.address, 6)).to.equal(1);
    });

    it("Should fail if insufficient token 0", async function () {
      await erc1155Token.connect(user1).mintToken6(); // Burn token 0
      await expect(
        erc1155Token.connect(user1).mintToken6()
      ).to.be.revertedWith("Insufficient token 0 to mint token 6");
    });

    it("Should fail if insufficient token 1", async function () {
      await erc1155Token.connect(user2).mintToken0();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user2).mintToken2();
      await expect(
        erc1155Token.connect(user2).mintToken6()
      ).to.be.revertedWith("Insufficient token 1 to mint token 6");
    });

    it("Should fail if insufficient token 2", async function () {
      await erc1155Token.connect(user2).mintToken0();
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");
      await erc1155Token.connect(user2).mintToken1();
      await expect(
        erc1155Token.connect(user2).mintToken6()
      ).to.be.revertedWith("Insufficient token 2 to mint token 6");
    });
  });

  describe("tokenBalanceOf", function () {
    beforeEach(async function () {
      await erc1155Token.connect(user1).mintToken0();
    });

    it("Should return token balance for the caller", async function () {
      const balance = await erc1155Token.connect(user1).tokenBalanceOf(user1.address, 0);
      expect(balance).to.equal(1);
    });

    it("Should fail if checking another user's balance", async function () {
      await expect(
        erc1155Token.connect(user1).tokenBalanceOf(user2.address, 0)
      ).to.be.revertedWith("You can only check your own balance.");
    });
  });
});