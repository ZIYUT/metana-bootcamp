const hre = require("hardhat");

async function main() {
  console.log("Deploying DonationVault contract...");

  // 部署 HopeStreamNFT 合约
  const HopeStreamNFT = await hre.ethers.getContractFactory("HopeStreamNFT");
  const nft = await HopeStreamNFT.deploy();
  await nft.waitForDeployment();
  console.log("HopeStreamNFT deployed to:", await nft.getAddress());

  // 部署 DonationVault 合约
  const DonationVault = await hre.ethers.getContractFactory("DonationVault");
  const [deployer] = await hre.ethers.getSigners();
  
  // 部署合约，将部署者设置为受益人
  const vault = await DonationVault.deploy(
    deployer.address, // beneficiary
    deployer.address  // initialOwner
  );
  await vault.waitForDeployment();
  console.log("DonationVault deployed to:", await vault.getAddress());

  // 设置 NFT 合约地址
  const tx = await vault.setDonorNFT(await nft.getAddress());
  await tx.wait();
  console.log("NFT contract address set in DonationVault");

  // 添加一个示例里程碑（30天后释放 0.1 ETH）
  const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
  const releaseTime = Math.floor(Date.now() / 1000) + thirtyDaysInSeconds;
  const releaseAmount = hre.ethers.parseEther("0.1");
  
  const addMilestoneTx = await vault.addMilestone(releaseTime, releaseAmount);
  await addMilestoneTx.wait();
  console.log("Added sample milestone:", {
    releaseTime: new Date(releaseTime * 1000).toISOString(),
    releaseAmount: hre.ethers.formatEther(releaseAmount) + " ETH"
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 