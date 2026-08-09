/**
 * Formats a Stellar address to a shortened version, e.g. GABC...XYZ1
 * @param {string} address - The full Stellar address
 * @param {number} chars - Number of characters to show at start and end
 * @returns {string} Shortened address
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

/**
 * Formats a raw balance string or number into a readable string with commas and decimals
 * @param {string|number} amount - The amount to format
 * @param {number} decimals - Max decimal places
 * @returns {string} Formatted amount
 */
export const formatXLM = (amount, decimals = 4) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.0000';
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(parsed);
};

/**
 * Formats a timestamp into a localized date-time string
 * @param {string|number|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
