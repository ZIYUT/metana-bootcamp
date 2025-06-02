/**
 * Compares prices between two sources and calculates arbitrage opportunity
 * @param {number} sourceAPrice - Price from the first source
 * @param {number} sourceBPrice - Price from the second source
 * @param {string} sourceAName - Name of the first source (e.g., "Chainlink")
 * @param {string} sourceBName - Name of the second source (e.g., "Uniswap")
 * @param {number} significanceThreshold - Threshold percentage for significant arbitrage (default: 0.5%)
 * @returns {Object} Arbitrage information object
 */
export function comparePrices(
    sourceAPrice,
    sourceBPrice,
    sourceAName = "Source A",
    sourceBName = "Source B",
    significanceThreshold = 0.7
  ) {
    // Handle invalid inputs
    if (
      sourceAPrice === null || 
      sourceBPrice === null || 
      isNaN(sourceAPrice) || 
      isNaN(sourceBPrice) ||
      sourceAPrice <= 0 || 
      sourceBPrice <= 0
    ) {
      return {
        priceDifference: null,
        percentageDifference: null,
        isSignificant: false,
        direction: "No valid prices to compare"
      };
    }
  
    // Calculate difference
    const priceDifference = Math.abs(sourceAPrice - sourceBPrice);
    
    // Calculate percentage difference based on the lower price
    const lowerPrice = Math.min(sourceAPrice, sourceBPrice);
    const percentageDifference = (priceDifference / lowerPrice) * 100;
    
    // Determine if the difference is significant
    const isSignificant = percentageDifference >= significanceThreshold;
    
    // Determine arbitrage direction
    let direction = "No significant arbitrage opportunity";
    if (isSignificant) {
      if (sourceAPrice < sourceBPrice) {
        direction = `Buy on ${sourceAName} (${sourceAPrice.toFixed(2)}) and sell on ${sourceBName} (${sourceBPrice.toFixed(2)})`;
      } else {
        direction = `Buy on ${sourceBName} (${sourceBPrice.toFixed(2)}) and sell on ${sourceAName} (${sourceAPrice.toFixed(2)})`;
      }
    }
  
    return {
      [sourceAName]: sourceAPrice,
      [sourceBName]: sourceBPrice,
      priceDifference,
      percentageDifference,
      isSignificant,
      direction
    };
  }