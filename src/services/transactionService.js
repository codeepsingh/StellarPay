const STORAGE_KEY = 'stellarpay_tx_history';

/**
 * Retrieves the stored transaction history from localStorage
 * @returns {Array} List of transactions
 */
export const getTransactionHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading transaction history:', error);
    return [];
  }
};

/**
 * Saves a new transaction record to localStorage (latest first)
 * @param {Object} txRecord - Transaction details
 * @param {string} txRecord.hash - Transaction Hash
 * @param {string|number} txRecord.amount - XLM Amount
 * @param {string} txRecord.recipient - Recipient Stellar Address
 * @param {string} txRecord.status - 'success' or 'failed'
 * @param {string} [txRecord.memo] - Optional Memo
 * @param {string} [txRecord.error] - Optional Error message if failed
 * @returns {Array} Updated transaction list
 */
export const saveTransaction = (txRecord) => {
  try {
    const currentHistory = getTransactionHistory();
    const newRecord = {
      ...txRecord,
      id: txRecord.hash || `err_${Date.now()}`,
      timestamp: txRecord.timestamp || new Date().toISOString(),
    };
    
    // Add to front of array (latest first)
    const updatedHistory = [newRecord, ...currentHistory];
    
    // Keep last 100 transactions to save space
    const trimmedHistory = updatedHistory.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    return trimmedHistory;
  } catch (error) {
    console.error('Error saving transaction:', error);
    return [];
  }
};

/**
 * Clears the transaction history from localStorage
 */
export const clearTransactionHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing transaction history:', error);
    return [];
  }
};
