import { Horizon, Networks, TransactionBuilder, Operation, Asset, Memo, Keypair } from 'stellar-sdk';
import freighterApi from '@stellar/freighter-api';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

// Robust helper to safely stringify or extract error messages
const getErrorMessage = (err) => {
  if (!err) return 'Unknown error occurred.';
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.error) {
    if (typeof err.error === 'string') return err.error;
    if (err.error.message && typeof err.error.message === 'string') return err.error.message;
  }
  try {
    const str = JSON.stringify(err);
    if (str && str !== '{}') return str;
  } catch {}
  return String(err);
};

/**
 * Checks if the Freighter Wallet extension is installed and available
 * @returns {Promise<boolean>} True if installed
 */
export const checkFreighterInstalled = async () => {
  try {
    const res = await freighterApi.isConnected();
    return !!(res && (res === true || res.isConnected === true));
  } catch (error) {
    console.error('Error checking Freighter installation:', error);
    return false;
  }
};

/**
 * Gets the connected public key from Freighter Wallet
 * @returns {Promise<string>} Stellar public key
 */
export const getFreighterPublicKey = async () => {
  try {
    const isInstalled = await checkFreighterInstalled();
    if (!isInstalled) {
      throw new Error('Freighter wallet is not installed. Please install it first.');
    }
    const res = await freighterApi.requestAccess();
    if (res && res.error) {
      throw new Error(getErrorMessage(res.error));
    }
    const pubKey = res && (res.address || res);
    if (!pubKey) {
      throw new Error('No account found. Please open Freighter and unlock your wallet.');
    }
    return pubKey;
  } catch (error) {
    console.error('Error getting public key:', error);
    throw error;
  }
};


/**
 * Checks if Freighter is set to the Stellar Testnet
 * @returns {Promise<boolean>} True if Testnet
 */
export const verifyTestnetNetwork = async () => {
  try {
    const res = await freighterApi.getNetwork();
    const net = res && (res.network || res);
    const passphrase = res && res.networkPassphrase;
    return (
      net === 'TESTNET' || 
      (typeof net === 'string' && net.toUpperCase().includes('TEST')) ||
      (passphrase && passphrase.includes('Test SDF Network'))
    );
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

/**
 * Fetches XLM balance and account activation status from Testnet Horizon
 * @param {string} publicKey - Stellar public key
 * @returns {Promise<{balance: string, isFunded: boolean}>} Balance status object
 */
export const fetchAccountDetails = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
    return {
      balance: nativeBalance ? nativeBalance.balance : '0.0000',
      isFunded: true,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        balance: '0.0000',
        isFunded: false,
      };
    }
    console.error('Error fetching account details:', error);
    throw new Error('Horizon API error. Failed to retrieve balance.');
  }
};

/**
 * Funds an account using the Stellar Testnet Friendbot Faucet API
 * @param {string} publicKey - Stellar public key
 * @returns {Promise<boolean>} True if success
 */
export const fundAccountWithFriendbot = async (publicKey) => {
  try {
    const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to fund account via Friendbot.');
    }
    return true;
  } catch (error) {
    console.error('Friendbot funding error:', error);
    throw error;
  }
};

/**
 * Builds and signs a payment transaction, then submits it to the Stellar Testnet
 * @param {string} senderAddress - Source wallet address
 * @param {string} recipientAddress - Destination wallet address
 * @param {string} amount - XLM amount
 * @param {string} [memoText] - Optional text memo
 * @returns {Promise<{hash: string, ledger: number, timestamp: string}>} Transaction receipt
 */
export const sendPayment = async (senderAddress, recipientAddress, amount, memoText = '') => {
  try {
    const walletType = localStorage.getItem('stellarpay_wallet_type') || 'freighter';
    
    // 1. Verify freighter network if active
    if (walletType === 'freighter') {
      const isTestnet = await verifyTestnetNetwork();
      if (!isTestnet) {
        throw new Error('Freighter is not set to Testnet. Please change the network in Freighter to Testnet.');
      }
    }

    // 2. Load sender account from Horizon
    let sourceAccount;
    try {
      sourceAccount = await server.loadAccount(senderAddress);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error('Sender account is not funded. Please click the Faucet button to request testnet XLM first.');
      }
      throw err;
    }

    // 3. Check if recipient exists
    let recipientExists = true;
    try {
      await server.loadAccount(recipientAddress);
    } catch (err) {
      if (err.response?.status === 404) {
        recipientExists = false;
      }
    }

    // 4. Build transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    });

    if (recipientExists) {
      transaction.addOperation(
        Operation.payment({
          destination: recipientAddress,
          asset: Asset.native(),
          amount: amount.toString(),
        })
      );
    } else {
      const parsedAmount = parseFloat(amount);
      if (parsedAmount < 1.0) {
        throw new Error('Recipient account is not funded/active. You must send at least 1 XLM to fund/create their account.');
      }
      transaction.addOperation(
        Operation.createAccount({
          destination: recipientAddress,
          startingBalance: amount.toString(),
        })
      );
    }

    transaction.setTimeout(30);

    if (memoText && memoText.trim() !== '') {
      transaction.addMemo(Memo.text(memoText));
    }

    const tx = transaction.build();
    let signedXdr;

    if (walletType === 'freighter') {
      const xdr = tx.toXDR();
      let signedXdrResult;
      try {
        signedXdrResult = await freighterApi.signTransaction(xdr, { network: 'TESTNET', networkPassphrase: Networks.TESTNET });
      } catch (err) {
        throw new Error('Transaction signing rejected by Freighter wallet.');
      }
      if (signedXdrResult && signedXdrResult.error) {
        throw new Error(getErrorMessage(signedXdrResult.error));
      }
      signedXdr = signedXdrResult && (signedXdrResult.signedTxXdr || signedXdrResult);
    } else {
      // Albedo/xBull simulated on-chain wallet signing
      const secret = localStorage.getItem(`stellarpay_sec_${walletType}`);
      if (!secret) {
        throw new Error(`Secret key not found for selected simulated wallet: ${walletType}`);
      }
      const keypair = Keypair.fromSecret(secret);
      tx.sign(keypair);
      signedXdr = tx.toXDR();
    }

    if (!signedXdr) {
      throw new Error('Failed to retrieve signed transaction.');
    }

    // 5. Submit transaction
    const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const response = await server.submitTransaction(signedTx);

    return {
      hash: response.hash,
      ledger: response.ledger,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Send payment transaction failure:', error);
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      let reason = codes.transaction;
      if (codes.operations && codes.operations.length > 0) {
        reason += ` (Op: ${codes.operations.join(', ')})`;
      }
      throw new Error(`Stellar Network Transaction Failed: ${reason}`);
    }
    throw new Error(getErrorMessage(error));
  }

};
