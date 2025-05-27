import Web3 from "web3";

const CHAINLINK_AGGREGATOR_ABI = [
    {
        inputs: [],
        name: "latestRoundData",
        outputs: [
            { name: "roundId", type: "uint80" },
            { name: "answer", type: "int256" },
            { name: "startedAt", type: "uint256" },
            { name: "updatedAt", type: "uint256" },
            { name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function"
    }
];

// Chainlink feed addresses
const FEEDS = {
    ETH_USD: "0x5f4eC3Df9cbd43714fe2740f5E3616155c5B8419",
    BTC_USD: "0xf4030086522a5beea4988f8ca5b36dbc97bee88c",
    LINK_USD: "0x76F8C9E423C228E83DCB11d17F0Bd8aEB0Ca01bb",
    USDC_USD: "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6",
    DAI_USD: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
    WBTC_BTC: "0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23",
    UNI_USD: "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
};

export async function getChainlinkPrice(
  symbols,
  rpcUrl = "https://eth.llamarpc.com"

  
) {
  const web3 = new Web3(rpcUrl);

  console.log("RPC URL used:", rpcUrl);


  if (typeof symbols === "string") {
    symbols = [symbols]; // normalize to array
  }

  const prices = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      const feedAddress = FEEDS[symbol];
      if (!feedAddress) {
        console.warn(`Feed not found for symbol: ${symbol}`);
        return;
      }

      const priceFeed = new web3.eth.Contract(CHAINLINK_AGGREGATOR_ABI, feedAddress);

      try {
        const [roundData, decimals] = await Promise.all([
          priceFeed.methods.latestRoundData().call(),
          priceFeed.methods.decimals().call(),
        ]);

        prices[symbol] = Number(roundData.answer) / 10 ** Number(decimals);
      } catch (err) {
        console.error(`Failed to fetch price for ${symbol}:`, err);
      }
    })
  );

  return prices;
}