const { ethers, upgrades, run } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // 部署 MyToken
    const MyToken = await ethers.getContractFactory("MyTokenUpgradeable");
    const token = await upgrades.deployProxy(MyToken, [deployer.address], {
        initializer: "initialize",
        kind: "uups",
    });
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("MyTokenUpgradeable deployed to:", tokenAddress);

    // 部署 MyNFT
    const MyNFT = await ethers.getContractFactory("MyNFTUpgradeable");
    const nft = await upgrades.deployProxy(MyNFT, [deployer.address], {
        initializer: "initialize",
        kind: "uups",
    });
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("MyNFTUpgradeable deployed to:", nftAddress);

    // 部署 NFTStaker
    const NFTStaker = await ethers.getContractFactory("NFTStakerUpgradeable");
    const staker = await upgrades.deployProxy(
        NFTStaker,
        [deployer.address, tokenAddress, nftAddress],
        { initializer: "initialize", kind: "uups" }
    );
    await staker.waitForDeployment();
    const stakerAddress = await staker.getAddress();
    console.log("NFTStakerUpgradeable deployed to:", stakerAddress);

    // 转移 Token 合约的所有权
    await token.transferOwnership(stakerAddress);
    console.log("Transferred MyToken ownership to NFTStaker");
    
    // 等待区块确认以确保 Etherscan 能够找到合约
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待 30 秒
    
    // 验证实现合约
    console.log("Verifying contracts on Etherscan...");
    
    // 获取实现合约地址
    const tokenImplementationAddress = await upgrades.erc1967.getImplementationAddress(tokenAddress);
    const nftImplementationAddress = await upgrades.erc1967.getImplementationAddress(nftAddress);
    const stakerImplementationAddress = await upgrades.erc1967.getImplementationAddress(stakerAddress);
    
    // 验证 Token 实现
    try {
        await run("verify:verify", {
            address: tokenImplementationAddress,
            constructorArguments: [],
        });
        console.log("MyTokenUpgradeable implementation verified");
    } catch (e) {
        console.log("Error verifying MyTokenUpgradeable:", e.message);
    }
    
    // 验证 NFT 实现
    try {
        await run("verify:verify", {
            address: nftImplementationAddress,
            constructorArguments: [],
        });
        console.log("MyNFTUpgradeable implementation verified");
    } catch (e) {
        console.log("Error verifying MyNFTUpgradeable:", e.message);
    }
    
    // 验证 Staker 实现
    try {
        await run("verify:verify", {
            address: stakerImplementationAddress,
            constructorArguments: [],
        });
        console.log("NFTStakerUpgradeable implementation verified");
    } catch (e) {
        console.log("Error verifying NFTStakerUpgradeable:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });