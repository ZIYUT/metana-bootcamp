import Web3 from 'web3';

// Connect to Ethereum network
const web3 = new Web3("https://eth.llamarpc.com");

// SushiSwap constants
const SUSHISWAP_FACTORY = web3.utils.toChecksumAddress('0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac');

// Token addresses (same as in Uniswap implementation)
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';

// Token decimals (cached for efficiency)
const TOKEN_DECIMALS = {
  [WETH_ADDRESS.toLowerCase()]: 18,
  [USDC_ADDRESS.toLowerCase()]: 6,  
  [WBTC_ADDRESS.toLowerCase()]: 8,
  [UNI_ADDRESS.toLowerCase()]: 18
};

// SushiSwap ABIs
const FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" }
    ],
    "name": "getPair",
    "outputs": [{ "internalType": "address", "name": "pair", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      { "internalType": "uint112", "name": "_reserve0", "type": "uint112" },
      { "internalType": "uint112", "name": "_reserve1", "type": "uint112" },
      { "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }
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

// Create factory contract instance
const factory = new web3.eth.Contract(FACTORY_ABI, SUSHISWAP_FACTORY);

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
 * Check if a pair exists on SushiSwap
 * @param {string} tokenA First token address
 * @param {string} tokenB Second token address
 * @returns {Promise<string>} Pair address or "0x0000000000000000000000000000000000000000" if not found
 */
async function getPairAddress(tokenA, tokenB) {
  const tokenAAddr = web3.utils.toChecksumAddress(tokenA);
  const tokenBAddr = web3.utils.toChecksumAddress(tokenB);
  return await factory.methods.getPair(tokenAAddr, tokenBAddr).call();
}

/**
 * Get price from SushiSwap for a token pair
 * @param {string} tokenA First token address
 * @param {string} tokenB Second token address 
 * @returns {Promise<number>} Price of tokenA in terms of tokenB
 */
export async function getPriceFromSushiSwap(tokenA, tokenB) {
  try {
    console.log(`Getting price for ${tokenA}/${tokenB} from SushiSwap`);
    
    const tokenAAddr = web3.utils.toChecksumAddress(tokenA);
    const tokenBAddr = web3.utils.toChecksumAddress(tokenB);
    
    // Get pair address
    const pairAddress = await getPairAddress(tokenAAddr, tokenBAddr);
    
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`Direct pair not found for ${tokenA}/${tokenB}, trying to route through WETH`);
      
      // Try routing through WETH if direct pair doesn't exist
      if (tokenAAddr !== WETH_ADDRESS && tokenBAddr !== WETH_ADDRESS) {
        const pairAtoWETH = await getPairAddress(tokenAAddr, WETH_ADDRESS);
        const pairWETHtoB = await getPairAddress(WETH_ADDRESS, tokenBAddr);
        
        if (pairAtoWETH !== '0x0000000000000000000000000000000000000000' && 
            pairWETHtoB !== '0x0000000000000000000000000000000000000000') {
          console.log(`Found route through WETH: ${tokenA} -> WETH -> ${tokenB}`);
          
          // Get A/WETH price
          const priceAtoWETH = await getDirectPairPrice(tokenAAddr, WETH_ADDRESS, pairAtoWETH);
          
          // Get WETH/B price
          const priceWETHtoB = await getDirectPairPrice(WETH_ADDRESS, tokenBAddr, pairWETHtoB);
          
          // Calculate A/B price through WETH
          const routedPrice = priceAtoWETH * priceWETHtoB;
          console.log(`Calculated routed price: ${routedPrice}`);
          return routedPrice;
        }
      }
      
      throw new Error(`No viable path found for ${tokenA}/${tokenB} on SushiSwap`);
    }
    
    return await getDirectPairPrice(tokenAAddr, tokenBAddr, pairAddress);
  } catch (err) {
    console.error("Error fetching price from SushiSwap:", err);
    throw err;
  }
}

/**
 * Get price for a direct pair (internal helper function)
 * @param {string} tokenA 
 * @param {string} tokenB 
 * @param {string} pairAddress 
 * @returns {Promise<number>}
 */
async function getDirectPairPrice(tokenA, tokenB, pairAddress) {
  console.log(`Getting direct pair price from ${pairAddress}`);
  
  // Create pair contract instance
  const pair = new web3.eth.Contract(PAIR_ABI, pairAddress);
  
  // Get token order to correctly interpret price
  const token0 = await pair.methods.token0().call();
  const token1 = await pair.methods.token1().call();
  
  console.log(`Pair token0: ${token0}`);
  console.log(`Pair token1: ${token1}`);
  
  const isTokenAToken0 = token0.toLowerCase() === tokenA.toLowerCase();
  
  // Get token decimals
  const token0Decimals = await getTokenDecimals(token0);
  const token1Decimals = await getTokenDecimals(token1);
  
  console.log(`Token0 (${token0}) decimals: ${token0Decimals}`);
  console.log(`Token1 (${token1}) decimals: ${token1Decimals}`);
  
  // Get reserves from the pool
  const reserves = await pair.methods.getReserves().call();
  const reserve0 = BigInt(reserves._reserve0);
  const reserve1 = BigInt(reserves._reserve1);
  
  console.log(`Reserve0: ${reserve0}`);
  console.log(`Reserve1: ${reserve1}`);
  
  // Safety check to prevent division by zero
  if (reserve0 === BigInt(0) || reserve1 === BigInt(0)) {
    throw new Error("Pool has zero reserves");
  }
  
  // Calculate price with proper decimal adjustment
  const decimalFactor = BigInt(10) ** BigInt(Math.abs(token0Decimals - token1Decimals));
  let price;
  
  if (isTokenAToken0) {
    // If tokenA is token0, price = reserve1/reserve0 (in terms of tokenB)
    if (token0Decimals >= token1Decimals) {
      price = Number(reserve1 * decimalFactor) / Number(reserve0);
    } else {
      price = Number(reserve1) / Number(reserve0 * decimalFactor);
    }
  } else {
    // If tokenA is token1, price = reserve0/reserve1 (in terms of tokenB)
    if (token1Decimals >= token0Decimals) {
      price = Number(reserve0 * decimalFactor) / Number(reserve1);
    } else {
      price = Number(reserve0) / Number(reserve1 * decimalFactor);
    }
  }
  
  console.log(`Final price: ${price}`);
  
  // If price is very close to 0 or exactly 0, there's a problem
  if (price < 0.0000001) {
    throw new Error(`Price calculated is too small: ${price}`);
  }
  
  return price;
}

/**
 * Fetch all relevant token prices from SushiSwap
 */
export async function getAllSushiSwapPrices() {
  try {
    // Try to fetch each price individually and handle errors gracefully
    let ethUsdPrice = null;
    let uniUsdPrice = null;
    let btcUsdPrice = null;

    try {
      ethUsdPrice = await getPriceFromSushiSwap(WETH_ADDRESS, USDC_ADDRESS);
      console.log(`ETH/USD price: ${ethUsdPrice}`);
    } catch (error) {
      console.error("Failed to fetch ETH/USD price from SushiSwap:", error);
    }

    try {
      uniUsdPrice = await getPriceFromSushiSwap(UNI_ADDRESS, USDC_ADDRESS);
      console.log(`UNI/USD price: ${uniUsdPrice}`);
    } catch (error) {
      console.error("Failed to fetch UNI/USD price from SushiSwap:", error);
    }

    try {
      btcUsdPrice = await getPriceFromSushiSwap(WBTC_ADDRESS, USDC_ADDRESS);
      console.log(`BTC/USD price: ${btcUsdPrice}`);
    } catch (error) {
      console.error("Failed to fetch BTC/USD price from SushiSwap:", error);
      // Try WBTC/WETH route if direct WBTC/USDC fails
      try {
        console.log("Trying alternative WBTC price calculation...");
        const btcEthPrice = await getPriceFromSushiSwap(WBTC_ADDRESS, WETH_ADDRESS);
        if (ethUsdPrice) {
          btcUsdPrice = btcEthPrice * ethUsdPrice;
          console.log(`Calculated BTC/USD price via ETH: ${btcUsdPrice}`);
        }
      } catch (innerError) {
        console.error("Failed to calculate alternative BTC/USD price:", innerError);
      }
    }

    return {
      source: "SushiSwap",
      price: {
        ETH_USD: ethUsdPrice,
        UNI_USD: uniUsdPrice,
        BTC_USD: btcUsdPrice
      }
    };
  } catch (error) {
    console.error("Error in getAllSushiSwapPrices:", error);
    return {
      source: "SushiSwap",
      price: {
        ETH_USD: ethUsdPrice || null,
        UNI_USD: uniUsdPrice || null, 
        BTC_USD: btcUsdPrice || null
      },
      error: error.message
    };
  }
}