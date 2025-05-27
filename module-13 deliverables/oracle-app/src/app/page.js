"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function Home() {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from user preference or localStorage
  useEffect(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode class to document when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save preference to localStorage
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/eth-price");

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setPriceData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching ETH prices:", err);
      setError("Failed to fetch price data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchPrices, 30000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format price with 2 decimal places
  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "Not available";
    } 
    return `$${price.toFixed(2)}`;
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get CSS class for arbitrage percentage
  const getPercentageClass = (percentage) => {
    if (percentage === null || percentage === undefined) return "text-gray-600";
    if (percentage > 1) return "text-green-600";
    if (percentage > 0.5) return "text-yellow-600";
    return "text-gray-600";
  };

  // Map cryptocurrency symbols to their logo URLs
  const getCryptoLogo = (symbol) => {
    const cryptoLogos = {
      "ETH_USD": "/coin-logo/eth-logo.png",
      "BTC_USD": "/coin-logo/btc-logo.png",
      "WBTC_USD": "/coin-logo/btc-logo.png",
      "LINK_USD": "/coin-logo/link-logo.png",
      "DAI_USD": "/coin-logo/dai-logo.png"
    };
    
    return cryptoLogos[symbol] || "/assets/generic-crypto.svg";
  };

  // Get display name for the cryptocurrency
  const getCryptoName = (symbol) => {
    const cryptoNames = {
      "ETH_USD": "Ethereum",
      "BTC_USD": "Bitcoin",
      "WBTC_USD": "Wrapped Bitcoin",
      "LINK_USD": "Chainlink",
      "DAI_USD": "DAI"
    };
    
    return cryptoNames[symbol] || symbol.replace('_', '/');
  };

  // Render arbitrage details for a specific pair
  const renderArbitrageDetails = (symbol, arbitrageData) => {
    if (!arbitrageData) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-50 border border-yellow-200 p-3 rounded mb-2">
          <p className="text-yellow-700">No arbitrage data available for {symbol}</p>
        </div>
      );
    }

    return (
      <div className={`border rounded-lg p-4 mb-2 ${
        arbitrageData.isSignificant ? 
          "bg-green-50 border-green-300" : 
          "bg-gray-50 border-gray-200"
      }`}>
        <h3 className="text-lg font-semibold mb-2 text-black">{symbol} Arbitrage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <p className="text-gray-600">Price Difference:</p>
            <p className="font-bold text-black">
              {arbitrageData.priceDifference !== null 
                ? formatPrice(arbitrageData.priceDifference) 
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Percentage Difference:</p>
            <p className={`font-bold ${getPercentageClass(arbitrageData.percentageDifference)}`}>
              {arbitrageData.percentageDifference !== null 
                ? `${arbitrageData.percentageDifference.toFixed(4)}%` 
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-gray-600">Recommended Action:</p>
          <p className={`font-semibold ${
            arbitrageData.isSignificant ? "text-green-600" : "text-gray-600"
          }`}>
            {arbitrageData.direction || "No significant arbitrage opportunity"}
          </p>
        </div>
      </div>
    );
  };

  // Render the overview tab with all price sources
  const renderOverviewTab = () => {
    if (!priceData) return null;
    
    return (
      <div className="overflow-x-auto">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Current Prices</h2>
        <table className="w-full border-collapse mb-8 bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-3 text-left text-black">Asset</th>
              <th className="border border-gray-300 p-3 text-center text-black">Chainlink</th>
              <th className="border border-gray-300 p-3 text-center text-black">Uniswap</th>
              <th className="border border-gray-300 p-3 text-center text-black">SushiSwap</th>
            </tr>
          </thead>
          <tbody>
            {["ETH_USD", "BTC_USD", "LINK_USD", "DAI_USD"].map((symbol) => {
              const chainlinkPrice = priceData.chainlink.price[symbol];
              const uniswapPrice = priceData.uniswap.price[symbol === 'BTC_USD' ? 'WBTC_USD' : symbol];
              const sushiswapPrice = priceData.sushiswap.price[symbol === 'BTC_USD' ? 'WBTC_USD' : symbol];
              
              return (
                <tr key={symbol} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 font-semibold">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={getCryptoLogo(symbol)} 
                        alt={symbol} 
                        className="w-6 h-6" 
                      />
                      <span className="text-gray-800">{getCryptoName(symbol)}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center text-blue-600 font-bold">
                    {formatPrice(chainlinkPrice)}
                  </td>
                  <td className="border border-gray-300 p-3 text-center text-purple-600 font-bold">
                    {formatPrice(uniswapPrice)}
                  </td>
                  <td className="border border-gray-300 p-3 text-center text-orange-600 font-bold">
                    {formatPrice(sushiswapPrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4 dark:text-white">Best Arbitrage Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["ETH_USD", "BTC_USD", "LINK_USD", "DAI_USD"].map(symbol => {
            // Find the best arbitrage opportunity for this symbol
            const chainlinkUniswap = priceData.arbitrage.chainlinkUniswap[symbol];
            const chainlinkSushiswap = priceData.arbitrage.chainlinkSushiswap[symbol];
            const uniswapSushiswap = priceData.arbitrage.uniswapSushiswap[symbol === 'BTC_USD' ? 'WBTC_USD' : symbol];
            
            // Find the best opportunity by highest percentage difference
            let bestOpportunity = null;
            let bestSource = "";
            
            if (chainlinkUniswap?.percentageDifference > (bestOpportunity?.percentageDifference || 0)) {
              bestOpportunity = chainlinkUniswap;
              bestSource = "Chainlink-Uniswap";
            }
            
            if (chainlinkSushiswap?.percentageDifference > (bestOpportunity?.percentageDifference || 0)) {
              bestOpportunity = chainlinkSushiswap;
              bestSource = "Chainlink-SushiSwap";
            }
            
            if (uniswapSushiswap?.percentageDifference > (bestOpportunity?.percentageDifference || 0)) {
              bestOpportunity = uniswapSushiswap;
              bestSource = "Uniswap-SushiSwap";
            }
            
            if (!bestOpportunity || !bestOpportunity.isSignificant) return null;
            
            return (
              <div key={symbol} className="border rounded-lg p-4 bg-green-50 border-green-300">
                <div className="flex items-center space-x-2 mb-2">
                  <img 
                    src={getCryptoLogo(symbol)} 
                    alt={symbol} 
                    className="w-6 h-6" 
                  />
                  <h3 className="text-lg font-semibold text-black">
                    {getCryptoName(symbol)} ({bestSource})
                  </h3>
                </div>
                <div>
                  <p className="text-gray-600">Percentage Difference:</p>
                  <p className={`font-bold ${getPercentageClass(bestOpportunity.percentageDifference)}`}>
                    {bestOpportunity.percentageDifference?.toFixed(4)}%
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">Action:</p>
                  <p className="font-semibold text-green-600">
                    {bestOpportunity.direction}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render each arbitrage comparison
  const renderArbitrageTab = (tabName) => {
    if (!priceData) return null;

    let title, arbitrageData;
    
    switch(tabName) {
      case "chainlinkUniswap":
        title = "Chainlink vs Uniswap";
        arbitrageData = priceData.arbitrage.chainlinkUniswap;
        break;
      case "chainlinkSushiswap":
        title = "Chainlink vs SushiSwap";
        arbitrageData = priceData.arbitrage.chainlinkSushiswap;
        break;
      case "uniswapSushiswap":
        title = "Uniswap vs SushiSwap";
        arbitrageData = priceData.arbitrage.uniswapSushiswap;
        break;
      default:
        return null;
    }

    const symbols = Object.keys(arbitrageData);

    return (
      <div>
        <h2 className="text-xl font-bold mb-4 dark:text-white">{title} Arbitrage</h2>
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-3 text-left text-black">Asset</th>
              <th className="border border-gray-300 p-3 text-center text-black">Price Difference</th>
              <th className="border border-gray-300 p-3 text-center text-black">% Difference</th>
              <th className="border border-gray-300 p-3 text-center text-black">Arbitrage Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => {
              const data = arbitrageData[symbol];
              if (!data) return null;
              
              return (
                <tr key={symbol} className={`${
                  data.isSignificant ? 
                    "bg-green-50" : 
                    "bg-white"
                } hover:bg-gray-50`}>
                  <td className="border border-gray-300 p-3 font-semibold">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={getCryptoLogo(symbol)} 
                        alt={symbol} 
                        className="w-6 h-6" 
                      />
                      <span className="text-black">{getCryptoName(symbol)}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center text-black">
                    {data.priceDifference !== null 
                      ? formatPrice(data.priceDifference) 
                      : "N/A"}
                  </td>
                  <td className={`border border-gray-300 p-3 text-center font-semibold ${getPercentageClass(data.percentageDifference)}`}>
                    {data.percentageDifference !== null 
                      ? `${data.percentageDifference.toFixed(4)}%` 
                      : "N/A"}
                  </td>
                  <td className={`border border-gray-300 p-3 text-center ${
                    data.isSignificant ? 
                      "text-green-600 font-semibold" : 
                      "text-gray-600"
                  }`}>
                    {data.isSignificant 
                      ? data.direction 
                      : "No Opportunity"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col dark:bg-gray-900 p-4 transition-colors duration-200 ml-20 mt-10 mr-20 mb-10`}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <img 
                src="/coin-logo/arbitracks-logo.png" 
                alt="Logo" 
                className="h-14" 
              />
            <h1 className="text-3xl font-bold dark:text-white">Welcome to Arbitracks Dashboard</h1>
            <p className="text-gray-400 dark:text-gray-400 mt-2">Track and analyze crypto price differences across exchanges</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Buttons Row */}
            <div className="flex items-end gap-4 mb-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Refresh Button */}
              <button 
                onClick={fetchPrices} 
                className="bg-green-700 hover:bg-green-900 text-white px-4 py-2 rounded flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <span>Refresh</span>
                )}
              </button>
            </div>

            {/* Last Updated Timestamp */}
            {lastUpdated && (
              <div className="text-sm dark:text-gray-100">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-white border-t border-r border-l border-gray-200 text-green-600"
                  : " dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("chainlinkUniswap")}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "chainlinkUniswap"
                  ? "bg-white border-t border-r border-l border-gray-200 text-green-600"
                  : "dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Chainlink vs Uniswap
            </button>
            <button
              onClick={() => setActiveTab("chainlinkSushiswap")}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "chainlinkSushiswap"
                  ? "bg-white border-t border-r border-l border-gray-200 text-green-600"
                  : "dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Chainlink vs SushiSwap
            </button>
            <button
              onClick={() => setActiveTab("uniswapSushiswap")}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "uniswapSushiswap"
                  ? "bg-white border-t border-r border-l border-gray-200 text-green-600"
                  : "dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Uniswap vs SushiSwap
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mt-2">
          {priceData ? (
            <>
              {activeTab === "overview" && renderOverviewTab()}
              {activeTab === "chainlinkUniswap" && renderArbitrageTab("chainlinkUniswap")}
              {activeTab === "chainlinkSushiswap" && renderArbitrageTab("chainlinkSushiswap")}
              {activeTab === "uniswapSushiswap" && renderArbitrageTab("uniswapSushiswap")}
            </>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading price data...</p>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-600 dark:text-gray-400">
              No price data available
            </div>
          )}
        </div>
        
        
      </div>
    </div>
  );
}