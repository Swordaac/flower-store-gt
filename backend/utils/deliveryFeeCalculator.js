/**
 * Delivery Fee Calculator Utility
 * Calculates delivery fees based on Canadian postal codes
 */

const deliveryFees = {
  "H1A 0A1": 50,
  "H1A 0A2": 50,
  "H1A 0A5": 50,
  "H1B 4H6": 36,
  "H1C": 32,
  "H1C 0C7": 30,
  "H1C 0C9": 30,
  "H1C 1N9": 30,
  "H1C 1X2": 45,
  "H1E": 30,
  "H1G": 30,
  "H1H": 30,
  "H1J": 30,
  "H1K": 30,
  "H1K 1V1": 35,
  "H1L": 30,
  "H1M": 28,
  "H1N": 30,
  "H1N 0A7": 30,
  "H1N 1C7": 25,
  "H1N 1C9": 25,
  "H1N 3B1": 30,
  "H1N 5L5": 30,
  "H1P": 25,
  "H1P 1H5": 30,
  "H1R": 25,
  "H1S": 20,
  "H1S 0C5": 30,
  "H1T": 30,
  "H1T 3G6": 18,
  "H1V 3C4": 28,
  "H1V 3E9": 22,
  "H1W": 25,
  "H1X": 25,
  "H1X 2S2": 25,
  "H1Y": 30,
  "H1Z": 25,
  "H2A": 25,
  "H2B": 25,
  "H2B 2X1": 25,
  "H2C": 25,
  "H2E": 25,
  "H2G": 25,
  "H2G 1K4": 25,
  "H2H": 25,
  "H2I": 20,
  "H2J": 25,
  "H2K": 25,
  "H2L": 25,
  "H2M": 25,
  "H2N": 20,
  "H2O": 15,
  "H2P": 20,
  "H2Q": 21,
  "H2R": 20,
  "H2S": 20,
  "H2S 1P3": 15,
  "H2T": 15,
  "H2U": 15,
  "H2V": 15,
  "H2W": 15,
  "H2X": 16,
  "H2Y": 20,
  "H2Z": 22,
  "H3A": 20,
  "H3B": 15,
  "H3C": 22,
  "H3C 1T3": 17,
  "H3C 2M8": 20,
  "H3E": 20,
  "H3G": 16,
  "H3G 1T7": 16,
  "H3H": 15,
  "H3H 2V1": 20,
  "H3J": 15,
  "H3K": 20,
  "H3K 2N9": 20,
  "H3L": 25,
  "H3L 3M7": 25,
  "H3M": 20,
  "H3N": 15,
  "H3P": 15,
  "H3P 2H2": 15,
  "H3R": 16,
  "H3R 1A7": 16,
  "H3S": 10,
  "H3T": 10,
  "H3T 1E2": 10,
  "H3T 1L5": 10,
  "H3T 1M5": 10,
  "H3V": 12,
  "H3W": 12,
  "H3W 1C1": 12,
  "H3W 1K8": 12,
  "H3X": 15,
  "H3Y": 15,
  "H3Z": 15,
  "H4A": 20,
  "H4B": 18,
  "H4C": 15,
  "H4E": 13,
  "H4G": 20,
  "H4H": 13,
  "H4J": 20,
  "H4J 1C5": 20,
  "H4K": 28,
  "H4L": 20,
  "H4M": 20,
  "H4N": 22,
  "H4P": 16,
  "H4R": 20,
  "H4R 2T6": 16,
  "H4S": 22,
  "H4T": 16,
  "H4V": 16,
  "H4V 2H6": 15,
  "H4W": 18,
  "H4X": 20,
  "H4Y": 20,
  "H4Z": 15,
  "H5A": 20,
  "H5B": 15,
  "H7A": 45,
  "H7B": 45,
  "H7C": 45,
  "H7E": 45,
  "H7E 3T2": 30,
  "H7E 4N9": 30,
  "H7E 5J2": 35,
  "H7G": 40,
  "H7H": 45,
  "H7J": 50,
  "H7K": 50,
  "H7L": 45,
  "H7M": 45,
  "H7N": 30,
  "H7P": 45,
  "H7R": 45,
  "H7S": 25,
  "H7T": 30,
  "H7V": 30,
  "H7W": 30,
  "H7X": 40,
  "H7X 4B8": 25,
  "H7Y": 45,
  "H8N": 20,
  "H8P": 25,
  "H8R": 25,
  "H8S": 25,
  "H8T": 25,
  "H8Y": 30,
  "H8Z": 30,
  "H9A": 30,
  "H9B": 30,
  "H9C": 50,
  "H9E": 50,
  "H9H": 50,
  "H9J": 30,
  "H9K": 45,
  "H9P": 30,
  "H9R": 32,
  "H9S": 30,
  "H9W": 28,
  "H9X": 45,
  "J3E 0H7": 60,
  "J3G 3V9": 55,
  "J3L": 42,
  "J3N 1L1": 50,
  "J3Y": 32,
  "J3Y 0R2": 32,
  "J4K": 28,
  "J4M": 38,
  "J4R 2C8": 28,
  "J4R 2H3": 25,
  "J4W": 25,
  "J4X 2R1": 28,
  "J4Z 1J1": 30,
  "J5C": 25,
  "J5C 1Y4": 30,
  "J5W 3W5": 30,
  "J6Z 4C2": 35,
  "J6G": 45,
  "J7R": 60,
  "J7T": 60,
  "J7V 0H8": 48,
  "J7V 0M2": 55,
  "J7V 6C4": 38,
  "J7W": 45,
  "J7X": 45
};

/**
 * Normalizes a postal code to a standard format
 * @param {string} postalCode - The postal code to normalize
 * @returns {string} - Normalized postal code
 */
function normalizePostalCode(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') {
    return '';
  }
  
  // Remove spaces and convert to uppercase
  return postalCode.replace(/\s/g, '').toUpperCase();
}

/**
 * Formats a postal code with space (e.g., "H1A0A1" -> "H1A 0A1")
 * @param {string} postalCode - The postal code to format
 * @returns {string} - Formatted postal code
 */
function formatPostalCode(postalCode) {
  const normalized = normalizePostalCode(postalCode);
  if (normalized.length === 6) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }
  return normalized;
}

/**
 * Calculates delivery fee based on postal code
 * @param {string} postalCode - The postal code to calculate fee for
 * @returns {Object} - Object containing fee information
 */
function calculateDeliveryFee(postalCode) {
  if (!postalCode) {
    return {
      success: false,
      error: 'Postal code is required',
      fee: null,
      postalCode: null
    };
  }

  const normalized = normalizePostalCode(postalCode);
  const formatted = formatPostalCode(postalCode);

  // First, try exact match with formatted postal code
  if (deliveryFees[formatted]) {
    return {
      success: true,
      fee: deliveryFees[formatted],
      postalCode: formatted,
      matchType: 'exact'
    };
  }

  // If no exact match, try to find a partial match (first 3 characters)
  // Only do partial matching if we have at least 3 characters
  if (normalized.length >= 3) {
    const prefix = normalized.slice(0, 3);
    const partialMatches = Object.keys(deliveryFees).filter(key => 
      key.startsWith(prefix) && key.length === 3
    );

    if (partialMatches.length > 0) {
      const fee = deliveryFees[partialMatches[0]];
      return {
        success: true,
        fee: fee,
        postalCode: formatted,
        matchType: 'partial',
        matchedPrefix: partialMatches[0]
      };
    }
  }

  // No match found
  return {
    success: false,
    error: 'Postal code not found in delivery area',
    fee: null,
    postalCode: formatted
  };
}

/**
 * Gets all available postal codes and their fees
 * @returns {Object} - Object containing all postal codes and fees
 */
function getAllDeliveryFees() {
  return { ...deliveryFees };
}

/**
 * Checks if a postal code is in the delivery area
 * @param {string} postalCode - The postal code to check
 * @returns {boolean} - True if postal code is in delivery area
 */
function isInDeliveryArea(postalCode) {
  const result = calculateDeliveryFee(postalCode);
  return result.success;
}

/**
 * Gets delivery fee statistics
 * @returns {Object} - Statistics about delivery fees
 */
function getDeliveryFeeStats() {
  const fees = Object.values(deliveryFees);
  const uniqueFees = [...new Set(fees)].sort((a, b) => a - b);
  
  return {
    totalAreas: fees.length,
    uniqueFees: uniqueFees,
    minFee: Math.min(...fees),
    maxFee: Math.max(...fees),
    averageFee: Math.round(fees.reduce((sum, fee) => sum + fee, 0) / fees.length * 100) / 100
  };
}

module.exports = {
  calculateDeliveryFee,
  getAllDeliveryFees,
  isInDeliveryArea,
  getDeliveryFeeStats,
  normalizePostalCode,
  formatPostalCode
};
