import { getChainlinkPrice } from "../../../lib/getChainLinkPrice";
import { getPriceFromUniswap } from "../../../lib/getUniswapPrice";
import { getPriceFromSushiSwap } from "../../../lib/getSushiSwapPrice";
import { comparePrices } from "../utils/compareprice";

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

export async function GET(req) {
    try {
      // Get Chainlink prices
      const chainlinkPrice = await getChainlinkPrice(["ETH_USD", "BTC_USD", "LINK_USD", "DAI_USD"]);

      // Get Uniswap prices for each token pair
      const uniswapPrices = await Promise.all([
        getPriceFromUniswap(WETH_ADDRESS, USDC_ADDRESS),  // ETH/USDC
        getPriceFromUniswap(WBTC_ADDRESS, USDC_ADDRESS),  // BTC/USDC
        getPriceFromUniswap(LINK_ADDRESS, USDC_ADDRESS),  // LINK/USDC
        getPriceFromUniswap(DAI_ADDRESS, USDC_ADDRESS),   // DAI/USDC
      ]);

      const uniswapPrice = {
        ETH_USD: uniswapPrices[0],
        WBTC_USD: uniswapPrices[1],
        LINK_USD: uniswapPrices[2],
        DAI_USD: uniswapPrices[3],
      };

      const sushiswapPrices = await Promise.all([
        getPriceFromSushiSwap(WETH_ADDRESS, USDC_ADDRESS),  // ETH/USDC
        getPriceFromSushiSwap(WBTC_ADDRESS, USDC_ADDRESS),  // BTC/USDC
        getPriceFromSushiSwap(LINK_ADDRESS, USDC_ADDRESS),  // LINK/USDC
        getPriceFromSushiSwap(DAI_ADDRESS, USDC_ADDRESS),   // DAI/USDC
      ]);

      const sushiswapPrice = {
        ETH_USD: sushiswapPrices[0],
        WBTC_USD: sushiswapPrices[1],
        LINK_USD: sushiswapPrices[2],
        DAI_USD: sushiswapPrices[3],
      };


      // Calculate arbitrage between Chainlink and Uniswap
      const chainlinkUniswapArbitrage = Object.keys(chainlinkPrice).reduce((result, symbol) => {
        if (
          chainlinkPrice[symbol] && 
          uniswapPrice[symbol === "BTC_USD" ? "WBTC_USD" : symbol]
        ) {
          result[symbol] = comparePrices(
            chainlinkPrice[symbol],
            uniswapPrice[symbol === "BTC_USD" ? "WBTC_USD" : symbol],
            "Chainlink",
            "Uniswap",
            0.7
          );
        } else {
          result[symbol] = {
            priceDifference: null,
            percentageDifference: null,
            isSignificant: false,
            direction: "No valid prices to compare"
          };
        }
        return result;
      }, {});

      // Calculate arbitrage between Chainlink and SushiSwap
      const chainlinkSushiswapArbitrage = Object.keys(chainlinkPrice).reduce((result, symbol) => {
        if (
          chainlinkPrice[symbol] && 
          sushiswapPrice[symbol === "BTC_USD" ? "WBTC_USD" : symbol]
        ) {
          result[symbol] = comparePrices(
            chainlinkPrice[symbol],
            sushiswapPrice[symbol === "BTC_USD" ? "WBTC_USD" : symbol],
            "Chainlink",
            "SushiSwap",
            0.7
          );
        } else {
          result[symbol] = {
            priceDifference: null,
            percentageDifference: null,
            isSignificant: false,
            direction: "No valid prices to compare"
          };
        }
        return result;
      }, {});

      // Calculate arbitrage between Uniswap and SushiSwap
      const uniswapSushiswapArbitrage = Object.keys(uniswapPrice).reduce((result, symbol) => {
        if (
          uniswapPrice[symbol] && 
          sushiswapPrice[symbol]
        ) {
          result[symbol] = comparePrices(
            uniswapPrice[symbol],
            sushiswapPrice[symbol],
            "Uniswap",
            "SushiSwap",
            0.7
          );
        } else {
          result[symbol] = {
            priceDifference: null,
            percentageDifference: null,
            isSignificant: false,
            direction: "No valid prices to compare"
          };
        }
        return result;
      }, {});

      return new Response(JSON.stringify({
        chainlink: {
          source: "Chainlink",
          price: chainlinkPrice
        },
        uniswap: {
          source: "Uniswap",
          price: uniswapPrice
        },
        sushiswap: {
          source: "SushiSwap",
          price: sushiswapPrice
        },
        arbitrage: {
          chainlinkUniswap: chainlinkUniswapArbitrage,
          chainlinkSushiswap: chainlinkSushiswapArbitrage,
          uniswapSushiswap: uniswapSushiswapArbitrage
        },
        timestamp: Date.now()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error fetching prices:", err);
      return new Response(
        JSON.stringify({ error: "Failed to fetch price", message: err.message }),
        JSON.stringify({ error: "Failed to fetch price", message: err.message }),
        { status: 500 }
      );
    }
  }