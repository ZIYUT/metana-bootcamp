import Web3 from 'web3';

//connect to Ethereum network
const web3 = new Web3("https://eth.llamarpc.com");

const UNISWAP_V3_FACTORY = web3.utils.toChecksumAddress('0x1F98431c8aD98523631AE4a59f267346ea31F984');
const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

// Token addresses
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';

// Token decimals
const TOKEN_DECIMALS = {
  [WETH_ADDRESS.toLowerCase()]: 18,
  [USDC_ADDRESS.toLowerCase()]: 6,  
  [WBTC_ADDRESS.toLowerCase()]: 8,
  [UNI_ADDRESS.toLowerCase()]: 18
};
    
// Uniswap V3 Pool ABI (for getting price)
const POOL_ABI = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" },
      { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
      { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
      { "internalType": "bool", "name": "unlocked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token1",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];
    
// Factory ABI (for getting pool address)
const FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "getPool",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Create factory contract instance
const factory = new web3.eth.Contract(FACTORY_ABI, UNISWAP_V3_FACTORY);

/**
 * Get ERC20 token decimals
 * @param {string} tokenAddress 
 * @returns {Promise<number>}
 */
async function getTokenDecimals(tokenAddress) {
  // Check if we already know the decimals
  const lowerCaseAddress = tokenAddress.toLowerCase();
  if (TOKEN_DECIMALS[lowerCaseAddress]) {
    return TOKEN_DECIMALS[lowerCaseAddress];
  }
  
  // Otherwise fetch from chain
  try {
    const ERC20_ABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"}];
    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
    const decimals = parseInt(await tokenContract.methods.decimals().call());
    
    // Cache it for future use
    TOKEN_DECIMALS[lowerCaseAddress] = decimals;
    return decimals;
  } catch (error) {
    console.warn(`Failed to get decimals for ${tokenAddress}, using default of 18`);
    return 18; // Default to 18 if we can't get the actual value
  }
}

/**
 * Get price from Uniswap with improved decimal handling
 */
export async function getPriceFromUniswap(tokenA, tokenB) {
  try {
    console.log(`Getting price for ${tokenA}/${tokenB}`);
    
    const tokenAAddr = web3.utils.toChecksumAddress(tokenA);
    const tokenBAddr = web3.utils.toChecksumAddress(tokenB);

    // Get the pool address by trying different fee tiers
    let poolAddress = '0x0000000000000000000000000000000000000000';
    let usedFeeTier = 0;
    
    for (const fee of FEE_TIERS) {
      const address = await factory.methods.getPool(tokenAAddr, tokenBAddr, fee).call();
      if (address !== '0x0000000000000000000000000000000000000000') {
        poolAddress = address;
        usedFeeTier = fee;
        console.log(`Found pool at ${poolAddress} with fee tier ${fee}`);
        break;
      }
    }

    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`No pool found for ${tokenA}/${tokenB}`);
    }

    // Create pool contract instance
    const pool = new web3.eth.Contract(POOL_ABI, poolAddress);

    // Get token order to interpret price correctly
    const token0 = await pool.methods.token0().call();
    const token1 = await pool.methods.token1().call();
    
    console.log(`Pool token0: ${token0}`);
    console.log(`Pool token1: ${token1}`);
    
    const isTokenAToken0 = token0.toLowerCase() === tokenAAddr.toLowerCase();

    // Get token decimals
    const token0Decimals = await getTokenDecimals(token0);
    const token1Decimals = await getTokenDecimals(token1);
    
    console.log(`Token0 (${token0}) decimals: ${token0Decimals}`);
    console.log(`Token1 (${token1}) decimals: ${token1Decimals}`);

    // Get current price from slot0
    const slot0Data = await pool.methods.slot0().call();
    const sqrtPriceX96 = BigInt(slot0Data.sqrtPriceX96);
    
    console.log(`sqrtPriceX96: ${sqrtPriceX96}`);

    // Safety check to prevent division by zero
    if (sqrtPriceX96 === BigInt(0)) {
      throw new Error("Pool returned sqrtPriceX96 of 0");
    }

    // Calculate price from sqrtPriceX96 with high precision
    const Q96 = BigInt(2) ** BigInt(96);
    const PRECISION = BigInt(10) ** BigInt(30); // Use higher precision for intermediate calculation

    // Calculate the raw price with decimal adjustment
    let priceRaw;
    let decimalAdjustment;

    if (isTokenAToken0) {
      // If tokenA is token0, we're calculating price of token1/token0
      decimalAdjustment = BigInt(10) ** BigInt(token0Decimals - token1Decimals);
      priceRaw = ((sqrtPriceX96 * sqrtPriceX96) * decimalAdjustment * PRECISION) / (Q96 * Q96);
    } else {
      // If tokenA is token1, we're calculating price of token0/token1
      decimalAdjustment = BigInt(10) ** BigInt(token1Decimals - token0Decimals);
      priceRaw = (Q96 * Q96 * decimalAdjustment * PRECISION) / (sqrtPriceX96 * sqrtPriceX96);
    }
    
    console.log(`Raw price calculation: ${priceRaw}`);
    console.log(`Decimal adjustment: ${decimalAdjustment}`);

    // Convert to human-readable number with better precision
    const price = Number(priceRaw) / Number(PRECISION);
    
    console.log(`Final price: ${price}`);

    // If price is very close to 0 or exactly 0, there's a problem
    if (price < 0.0000001) {
      throw new Error(`Price calculated is too small: ${price}`);
    }

    return price;
  } catch (err) {
    console.error("Error fetching price from Uniswap:", err);
    throw err;
  }
}

/**
 * Fetch all relevant token prices from Uniswap
 */
export async function getAllUniswapPrices() {
  try {
    // Try to fetch each price individually and handle errors gracefully
    let ethUsdPrice = null;
    let uniUsdPrice = null;
    let btcUsdPrice = null;

    try {
      ethUsdPrice = await getPriceFromUniswap(WETH_ADDRESS, USDC_ADDRESS);
      console.log(`ETH/USD price: ${ethUsdPrice}`);
    } catch (error) {
      console.error("Failed to fetch ETH/USD price:", error);
    }

    try {
      uniUsdPrice = await getPriceFromUniswap(UNI_ADDRESS, USDC_ADDRESS);
      console.log(`UNI/USD price: ${uniUsdPrice}`);
    } catch (error) {
      console.error("Failed to fetch UNI/USD price:", error);
    }

    try {
      btcUsdPrice = await getPriceFromUniswap(WBTC_ADDRESS, USDC_ADDRESS);
      console.log(`BTC/USD price: ${btcUsdPrice}`);
    } catch (error) {
      console.error("Failed to fetch BTC/USD price:", error);
    }

    return {
      source: "Uniswap",
      price: {
        ETH_USD: ethUsdPrice,
        UNI_USD: uniUsdPrice,
        BTC_USD: btcUsdPrice
      }
    };
  } catch (error) {
    console.error("Error in getAllUniswapPrices:", error);
    return {
      source: "Uniswap",
      price: {
        ETH_USD: null,
        UNI_USD: null, 
        BTC_USD: null
      },
      error: error.message
    };
  }
}