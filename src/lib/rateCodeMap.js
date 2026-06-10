/**
 * RateCode to Classification Name mapping
 * Maps billing rate codes (01-21 + variants) to customer classification names
 * Used for filter dropdowns and analytics categorization
 */

export const RATE_CODE_MAP = {
  '01': 'RESIDENTIAL',
  '02': 'RESIDENTIAL (Domestic)',
  '02A': 'RESIDENTIAL (Domestic 2A)',
  '03': 'COMMERCIAL (Small)',
  '04': 'COMMERCIAL (Medium)',
  '05': 'INDUSTRIAL',
  '06': 'COMMERCIAL (Laundry)',
  '07': 'COMMERCIAL (Restaurant)',
  '08': 'COMMERCIAL (Hospital)',
  '09': 'GOVERNMENT',
  '09A': 'GOVERNMENT (Agency A)',
  '09B': 'GOVERNMENT (Agency B)',
  '10': 'COMMERCIAL (School)',
  '11': 'COMMERCIAL (Market)',
  '12': 'COMMERCIAL (Bakery)',
  '13': 'SUBDIVISION',
  '14': 'INSTITUTIONAL (Church)',
  '15': 'INSTITUTIONAL (NGO)',
  '15A': 'INSTITUTIONAL (NGO Type A)',
  '16': 'INSTITUTIONAL (School)',
  '17': 'INSTITUTIONAL (University)',
  '18': 'COMMERCIAL (Manufacturing)',
  '19': 'COMMERCIAL (Construction)',
  '20': 'BULK SALES',
  '21': 'BULK SALES (Industrial)',
};

/**
 * Get classification name for a rate code
 * @param {string} rateCode - The rate code to look up
 * @returns {string} The classification name, or the rate code itself if not found
 */
export function getClassificationName(rateCode) {
  return RATE_CODE_MAP[rateCode] || rateCode;
}

/**
 * Get all unique rate codes
 * @returns {string[]} Array of rate codes, sorted
 */
export function getAllRateCodes() {
  return Object.keys(RATE_CODE_MAP).sort();
}

/**
 * Get all unique classifications
 * @returns {string[]} Array of classification names, sorted and unique
 */
export function getAllClassifications() {
  const classifications = Object.values(RATE_CODE_MAP);
  return [...new Set(classifications)].sort();
}

/**
 * Format a rate code with its classification name
 * @param {string} rateCode - The rate code
 * @returns {string} Formatted as "01 - RESIDENTIAL"
 */
export function formatRateCode(rateCode) {
  const name = getClassificationName(rateCode);
  return `${rateCode} - ${name}`;
}
