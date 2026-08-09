/**
 * Validates if a string is a valid Stellar public key (G...)
 * @param {string} address - The Stellar address to validate
 * @returns {boolean} True if valid
 */
export const isValidStellarAddress = (address) => {
  if (!address) return false;
  // Stellar public keys always start with G, are 56 characters long, and use base32 (A-Z, 2-7)
  const stellarAddressRegex = /^G[A-D2-7][A-Z2-7]{54}$/;
  return stellarAddressRegex.test(address);
};

/**
 * Validates a transaction amount against the user's available balance
 * @param {string|number} amount - The amount to send
 * @param {number} availableBalance - The user's current XLM balance
 * @returns {string|null} Error message, or null if valid
 */
export const validateAmount = (amount, availableBalance) => {
  if (amount === undefined || amount === null || amount === '') {
    return 'Amount is required';
  }
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return 'Amount must be a valid number';
  }
  
  if (parsedAmount <= 0) {
    return 'Amount must be greater than 0';
  }

  // Stellar requires at least 0.5 XLM for reserve + base fee, but let's just enforce that it's less than balance
  if (parsedAmount >= availableBalance) {
    return 'Insufficient balance (keep enough for network fee, min 0.00001 XLM)';
  }

  // Minimum fee is usually 0.00001 XLM, but user needs to keep 1 XLM reserve if they want their account to remain active.
  if (availableBalance - parsedAmount < 1.0) {
    return 'Warning: Sending this amount will leave you with less than the 1 XLM minimum reserve. Keep at least 1 XLM for fees and reserves.';
  }

  return null;
};

/**
 * Validates Stellar Text Memo length (max 28 bytes)
 * @param {string} memo - The memo string
 * @returns {string|null} Error message, or null if valid
 */
export const validateMemo = (memo) => {
  if (!memo) return null;
  // A text memo is limited to 28 bytes. In ASCII/UTF-8, characters can be 1-4 bytes.
  // We can measure byte length using Blob or TextEncoder.
  const byteLength = new TextEncoder().encode(memo).length;
  if (byteLength > 28) {
    return `Memo is too long (${byteLength} bytes). Stellar text memos are limited to 28 bytes.`;
  }
  return null;
};
