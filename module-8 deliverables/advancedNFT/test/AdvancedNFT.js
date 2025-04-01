const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("AdvancedNFT", function () {
  let AdvancedNFT, nft, owner, addr1, addr2, merkleRoot, merkleTree;

  // Deploy contract before each test
  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Create Merkle tree
    const addresses = [addr1.address, addr2.address];
    const leaves = addresses.map((addr, index) =>
      keccak256(Buffer.from(addr.slice(2) + index.toString().padStart(64, "0"), "hex"))
    );
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Deploy contract
    const AdvancedNFT = await ethers.getContractFactory("AdvancedNFT");
    nft = await AdvancedNFT.deploy(merkleRoot, owner.address);
  });

  // 1. Test Merkle Tree Airdrop
  describe("Merkle Tree Airdrop", function () {
    it("should allow airdrop mint with valid Merkle proof", async function () {
      await nft.setSaleState(1); // PRESALE state
      const proof = merkleTree.getHexProof(
        keccak256(Buffer.from(addr1.address.slice(2) + "0".padStart(64, "0"), "hex"))
      );
      await nft.connect(addr1).airdropMint(proof, 0, { value: ethers.parseEther("0.05") });
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
    });

    it("should prevent double minting with mapping", async function () {
      await nft.setSaleState(1); // PRESALE
      const proof = merkleTree.getHexProof(
        keccak256(Buffer.from(addr1.address.slice(2) + "0".padStart(64, "0"), "hex"))
      );
      await nft.connect(addr1).airdropMint(proof, 0, { value: ethers.parseEther("0.05") });
      await expect(
        nft.connect(addr1).airdropMint(proof, 0, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Already minted");
    });
  });

  // 2. Test Gas Cost Comparison
  describe("Gas Cost Comparison", function () {
    it("should measure gas cost for mapping vs bitmap", async function () {
      await nft.setSaleState(1); // PRESALE
      const proof = merkleTree.getHexProof(
        keccak256(Buffer.from(addr1.address.slice(2) + "0".padStart(64, "0"), "hex"))
      );
      const tx = await nft.connect(addr1).airdropMint(proof, 0, { value: ethers.parseEther("0.05") });
      const receipt = await tx.wait();
      console.log("Gas used with mapping:", receipt.gasUsed.toString());
    });
  });

  // 3. Test Commit-Reveal Mechanism
  describe("Commit-Reveal Mechanism", function () {
    it("should allocate random NFT ID with commit-reveal", async function () {
      await nft.setSaleState(1); // PRESALE
      
      // Create a simple numeric secret
      const secretInt = 123456;
      
      // Create commitment matching contract's format
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'uint256'],
          [addr1.address, secretInt]
        )
      );
      
      await nft.connect(addr1).commit(commitment);

      // Mine 10 blocks
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Reveal with the same secret
      await nft.connect(addr1).reveal(secretInt, { value: ethers.parseEther("0.05") });
      
      // Check that the user has minted
      const hasMinted = await nft.hasMintedMapping(addr1.address);
      expect(hasMinted).to.be.true;
    });
  });

  // 4. Test Multicall Batch Transfer - FIXED
  describe("Multicall Batch Transfer", function () {
    it("should allow batch transfer of NFTs", async function () {
      // Set to PRESALE for minting
      await nft.setSaleState(1); // PRESALE
      
      // First mint with proper Merkle proof for addr1
      const proof1 = merkleTree.getHexProof(
        keccak256(Buffer.from(addr1.address.slice(2) + "0".padStart(64, "0"), "hex"))
      );
      await nft.connect(addr1).airdropMint(proof1, 0, { value: ethers.parseEther("0.05") });
      
      // Second mint with proper Merkle proof for addr2
      const proof2 = merkleTree.getHexProof(
        keccak256(Buffer.from(addr2.address.slice(2) + "1".padStart(64, "0"), "hex"))
      );
      await nft.connect(addr2).airdropMint(proof2, 1, { value: ethers.parseEther("0.05") });
      
      // Transfer token from addr2 to addr1 so addr1 has both tokens
      await nft.connect(addr2).transferFrom(addr2.address, addr1.address, 1);
      
      // Now addr1 has both tokens (0 and 1)
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      
      // Now batch transfer both tokens to addr2
      await nft.connect(addr1).transferBatch(
        [addr2.address, addr2.address],
        [0, 1]
      );
      
      // Verify both tokens were transferred
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });
  });

  // 5. Test State Machine
  describe("State Machine", function () {
    it("should enforce minting based on sale state", async function () {
      // Default state is INACTIVE (0)
      await expect(
        nft.connect(addr1).airdropMint([], 0, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Presale not active");

      await nft.setSaleState(1); // PRESALE
      const proof = merkleTree.getHexProof(
        keccak256(Buffer.from(addr1.address.slice(2) + "0".padStart(64, "0"), "hex"))
      );
      await nft.connect(addr1).airdropMint(proof, 0, { value: ethers.parseEther("0.05") });
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
    });
  });

  // 6. Test Fund Withdrawal - FIXED
  describe("Fund Withdrawal", function () {
    it("should allow designated address to withdraw funds", async function () {
      // Set to PRESALE
      await nft.setSaleState(1); // PRESALE
      
      // Mint with proper proof
      const proof = merkleTree.getHexProof(
        keccak256(Buffer.from(addr1.address.slice(2) + "0".padStart(64, "0"), "hex"))
      );
      await nft.connect(addr1).airdropMint(proof, 0, { value: ethers.parseEther("0.05") });
      
      // Check balance before withdrawal
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Withdraw funds
      await nft.withdrawFunds([owner.address]);
      
      // Claim funds (needed with the pull pattern)
      await nft.connect(owner).claimFunds();
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Updated comparison for ethers.js v6
      expect(balanceAfter > balanceBefore).to.be.true;
    });
  });
});
