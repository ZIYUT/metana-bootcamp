const { ethers, upgrades, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contracts with account:", deployer.address);

  // 获取当前已部署的代理地址
  // 这里需要替换为您部署后得到的代理地址
  const proxyAddress = "YOUR_NFT_PROXY_ADDRESS_HERE";
  
  // 升级到新实现
  const MyNFTUpgradeable_New = await ethers.getContractFactory("MyNFTUpgradeable_New");
  console.log("Upgrading MyNFTUpgradeable...");
  
  const upgraded = await upgrades.upgradeProxy(proxyAddress, MyNFTUpgradeable_New);
  await upgraded.waitForDeployment();
  console.log("MyNFTUpgradeable upgraded to MyNFTUpgradeable_New");
  
  // 等待区块确认
  console.log("Waiting for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 等待 30 秒
  
  // 验证新实现
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  
  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
    console.log("New implementation verified");
  } catch (e) {
    console.log("Error verifying implementation:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });