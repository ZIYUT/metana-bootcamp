const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArbitrageExecutor", function () {
    let arbitrageExecutor;
    let mockUniswapPool;
    let mockSushiswapPair;
    let mockSwapper;
    let priceLibrary;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy PriceLibrary first
        const PriceLibrary = await ethers.getContractFactory("PriceLibrary");
        priceLibrary = await PriceLibrary.deploy();

        // Deploy mock contracts
        const MockUniswapV3Pool = await ethers.getContractFactory("MockUniswapV3Pool");
        mockUniswapPool = await MockUniswapV3Pool.deploy();

        const MockSushiswapPair = await ethers.getContractFactory("MockSushiswapPair");
        mockSushiswapPair = await MockSushiswapPair.deploy();

        const MockSwapper = await ethers.getContractFactory("MockSwapper");
        mockSwapper = await MockSwapper.deploy();

        // Deploy ArbitrageExecutor with library
        const ArbitrageExecutor = await ethers.getContractFactory("ArbitrageExecutor", {
            libraries: {
                PriceLibrary: await priceLibrary.getAddress()
            }
        });
        arbitrageExecutor = await ArbitrageExecutor.deploy(
            await mockUniswapPool.getAddress(),
            await mockSushiswapPair.getAddress(),
            await mockSwapper.getAddress()
        );
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await arbitrageExecutor.owner()).to.equal(owner.address);
        });

        it("Should set the correct pool addresses", async function () {
            expect(await arbitrageExecutor.uniswapPool()).to.equal(await mockUniswapPool.getAddress());
            expect(await arbitrageExecutor.sushiswapPair()).to.equal(await mockSushiswapPair.getAddress());
        });
    });

    describe("Parameters", function () {
        it("Should have correct initial parameters", async function () {
            expect(await arbitrageExecutor.minProfitAmount()).to.equal(ethers.parseEther("0.001"));
            expect(await arbitrageExecutor.minPriceDeviation()).to.equal(50);
            expect(await arbitrageExecutor.maxFlashLoanAmount()).to.equal(ethers.parseEther("100"));
        });

        it("Should allow owner to update parameters", async function () {
            await arbitrageExecutor.updateParameters(
                ethers.parseEther("0.002"),
                100,
                ethers.parseEther("200")
            );

            expect(await arbitrageExecutor.minProfitAmount()).to.equal(ethers.parseEther("0.002"));
            expect(await arbitrageExecutor.minPriceDeviation()).to.equal(100);
            expect(await arbitrageExecutor.maxFlashLoanAmount()).to.equal(ethers.parseEther("200"));
        });

        it("Should not allow non-owner to update parameters", async function () {
            await expect(
                arbitrageExecutor.connect(addr1).updateParameters(
                    ethers.parseEther("0.002"),
                    100,
                    ethers.parseEther("200")
                )
            ).to.be.revertedWithCustomError(arbitrageExecutor, "OwnableUnauthorizedAccount");
        });
    });

    describe("Automation", function () {
        it("Should return false when prices are equal", async function () {
            // Set equal prices (scaled by 1e6)
            await mockUniswapPool.setPrice(2000 * 1e6);
            await mockSushiswapPair.setPrice(2000 * 1e6);

            // Get prices and diff for debugging
            const uniswapPrice = await priceLibrary.getCurrentPrices.staticCall(
                await mockUniswapPool.getAddress(),
                await mockSushiswapPair.getAddress()
            );
            const [priceDiff, firstHigher] = await priceLibrary.calculatePriceDifference.staticCall(
                uniswapPrice[0],
                uniswapPrice[1]
            );
            console.log("[Equal] Uniswap:", uniswapPrice[0].toString(), "Sushi:", uniswapPrice[1].toString(), "Diff:", priceDiff.toString(), "FirstHigher:", firstHigher);

            const [upkeepNeeded] = await arbitrageExecutor.checkUpkeep.staticCall("0x");
            expect(upkeepNeeded).to.be.false;
        });

        it("Should return true when price deviation is sufficient and time interval passed", async function () {
            // Set prices with 1% difference (more than minPriceDeviation of 0.5%)
            await mockUniswapPool.setPrice(2000 * 1e6);
            await mockSushiswapPair.setPrice(2020 * 1e6); // 1% difference

            // Advance time by 5 minutes (300 seconds)
            await ethers.provider.send("evm_increaseTime", [300]);
            await ethers.provider.send("evm_mine");

            const uniswapPrice = await priceLibrary.getCurrentPrices.staticCall(
                await mockUniswapPool.getAddress(),
                await mockSushiswapPair.getAddress()
            );
            const [priceDiff, firstHigher] = await priceLibrary.calculatePriceDifference.staticCall(
                uniswapPrice[0],
                uniswapPrice[1]
            );
            console.log("[Sufficient] Uniswap:", uniswapPrice[0].toString(), "Sushi:", uniswapPrice[1].toString(), "Diff:", priceDiff.toString(), "FirstHigher:", firstHigher);

            const [upkeepNeeded] = await arbitrageExecutor.checkUpkeep.staticCall("0x");
            expect(upkeepNeeded).to.be.true;
        });

        it("Should return false when price deviation is sufficient but time interval not passed", async function () {
            // Set prices with 1% difference (more than minPriceDeviation of 0.5%)
            await mockUniswapPool.setPrice(2000 * 1e6);
            await mockSushiswapPair.setPrice(2020 * 1e6); // 1% difference

            // Don't advance time, so time interval condition will fail

            const uniswapPrice = await priceLibrary.getCurrentPrices.staticCall(
                await mockUniswapPool.getAddress(),
                await mockSushiswapPair.getAddress()
            );
            const [priceDiff, firstHigher] = await priceLibrary.calculatePriceDifference.staticCall(
                uniswapPrice[0],
                uniswapPrice[1]
            );
            console.log("[TimeInterval] Uniswap:", uniswapPrice[0].toString(), "Sushi:", uniswapPrice[1].toString(), "Diff:", priceDiff.toString(), "FirstHigher:", firstHigher);

            const [upkeepNeeded] = await arbitrageExecutor.checkUpkeep.staticCall("0x");
            expect(upkeepNeeded).to.be.false;
        });
    });

    describe("Events", function () {
        it("Should emit ParametersUpdated event", async function () {
            await expect(
                arbitrageExecutor.updateParameters(
                    ethers.parseEther("0.002"),
                    100,
                    ethers.parseEther("200")
                )
            )
                .to.emit(arbitrageExecutor, "ParametersUpdated")
                .withArgs(
                    ethers.parseEther("0.002"),
                    100,
                    ethers.parseEther("200")
                );
        });

        it("Should emit UpkeepCheck event", async function () {
            // Set prices with sufficient deviation to trigger upkeep
            await mockUniswapPool.setPrice(2000 * 1e6);
            await mockSushiswapPair.setPrice(2020 * 1e6); // 1% difference

            // Advance time by 5 minutes (300 seconds)
            await ethers.provider.send("evm_increaseTime", [300]);
            await ethers.provider.send("evm_mine");

            // Execute checkUpkeep and wait for transaction
            const tx = await arbitrageExecutor.checkUpkeep("0x");
            const receipt = await tx.wait();
            
            // Get the contract interface to parse events
            const contractInterface = arbitrageExecutor.interface;
            
            // Find the UpkeepCheck event in the logs
            const event = receipt.logs.find(
                log => {
                    try {
                        const parsedLog = contractInterface.parseLog(log);
                        return parsedLog.name === "UpkeepCheck";
                    } catch (e) {
                        return false;
                    }
                }
            );
            
            expect(event).to.not.be.undefined;
            
            // Verify event parameters
            const parsedLog = contractInterface.parseLog(event);
            expect(parsedLog.args.uniswapPrice).to.be.closeTo(2000000000, 2e6); // Allow small rounding error
            expect(parsedLog.args.sushiswapPrice).to.be.closeTo(2020000000, 2e6); // Allow small rounding error
            expect(parsedLog.args.priceDiff).to.be.gt(50); // Should be greater than minPriceDeviation
            expect(parsedLog.args.upkeepNeeded).to.be.true;
        });
    });
}); 