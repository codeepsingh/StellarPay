import { Horizon, Networks, TransactionBuilder, Operation, Asset, Memo, Keypair, Contract, Address, Account, rpc, scValToNative, nativeToScVal } from 'stellar-sdk';
import freighterApi from '@stellar/freighter-api';

export const CONTRACT_ADDRESS = 'CASPRTNB2I7EHMEFXPVG5OIFNRRS6WF75HNAHWC54IMDZEP3P6JNS6GR';
export const XLM_TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJGWNJRNPAYCSSST5QXQRBA3CO26C6KM2';
export { nativeToScVal, scValToNative, StrKey } from 'stellar-sdk';

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

/**
 * Query a read-only method on the Soroban smart contract using RPC simulation
 * @param {string} methodName - Contract method name
 * @param {Array} args - scVal arguments
 * @returns {Promise<any>} Parsed native JavaScript value or null
 */
export const queryContractMethod = async (methodName, args = []) => {
  try {
    const rpcServer = new rpc.Server('https://soroban-testnet.stellar.org');
    
    // We can use a dummy/placeholder source account for simulation
    const dummySource = 'GCQK2KUE6UAYMTVZ334WMTLDY3XP3JAQ24NE2I6W5WXXQFVZF4EAN5YP';
    const sourceAccount = new Account(dummySource, '0');
    
    const contract = new Contract(CONTRACT_ADDRESS);
    const op = contract.call(methodName, ...args);
    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    })
    .addOperation(op)
    .setTimeout(30)
    .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    if (simResult.error) {
      console.warn(`Simulation warning for ${methodName}:`, simResult.error);
      return null;
    }
    
    if (simResult.result?.retval) {
      return scValToNative(simResult.result.retval);
    }
    return null;
  } catch (error) {
    console.error(`Error querying contract method ${methodName}:`, error);
    return null;
  }
};

/**
 * Builds, simulates/assembles, signs, and submits a contract invocation to the Stellar Testnet
 * @param {string} senderAddress - Source wallet address
 * @param {string} methodName - Contract method name
 * @param {Array} args - scVal arguments
 * @returns {Promise<{hash: string, returnValue: any}>} Transaction receipt details
 */
export const invokeContractMethod = async (senderAddress, methodName, args = []) => {
  try {
    const walletType = localStorage.getItem('stellarpay_wallet_type') || 'freighter';
    
    if (walletType === 'freighter') {
      const isTestnet = await verifyTestnetNetwork();
      if (!isTestnet) {
        throw new Error('Freighter is not set to Testnet. Please change the network in Freighter to Testnet.');
      }
    }

    const rpcServer = new rpc.Server('https://soroban-testnet.stellar.org');

    // 1. Load source account from Horizon to get sequence number
    let sourceAccount;
    try {
      sourceAccount = await server.loadAccount(senderAddress);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error('Sender account is not funded. Please navigate to Faucet and fund your account first.');
      }
      throw err;
    }

    // 2. Build raw transaction with the Contract Call Operation
    const contract = new Contract(CONTRACT_ADDRESS);
    const op = contract.call(methodName, ...args);
    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    })
    .addOperation(op)
    .setTimeout(60)
    .build();

    // 3. Assemble transaction (performs simulation and sets footprints/resource fees)
    let assembledTx;
    try {
      assembledTx = await rpcServer.prepareTransaction(tx);
    } catch (simError) {
      console.error('Simulation/Assembly failed:', simError);
      throw new Error(`Transaction simulation failed: ${getErrorMessage(simError)}`);
    }

    // 4. Sign transaction
    let signedXdr;
    if (walletType === 'freighter') {
      const xdr = assembledTx.toXDR();
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
      const secret = localStorage.getItem(`stellarpay_sec_${walletType}`);
      if (!secret) {
        throw new Error(`Secret key not found for selected simulated wallet: ${walletType}`);
      }
      const keypair = Keypair.fromSecret(secret);
      assembledTx.sign(keypair);
      signedXdr = assembledTx.toXDR();
    }

    if (!signedXdr) {
      throw new Error('Failed to retrieve signed transaction.');
    }

    // 5. Submit transaction via RPC
    const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const response = await rpcServer.sendTransaction(signedTx);

    if (response.status === 'ERROR') {
      throw new Error(`Submitting transaction failed: ${response.errorResultXdr || 'unknown error'}`);
    }

    // 6. Polling status
    const txHash = response.hash;
    let pollAttempts = 0;
    while (pollAttempts < 30) {
      await new Promise(r => setTimeout(r, 1500));
      const statusResponse = await rpcServer.getTransaction(txHash);
      if (statusResponse.status === 'SUCCESS') {
        let nativeRetVal = null;
        if (statusResponse.resultMetaXdr) {
          try {
            if (statusResponse.returnValue) {
              nativeRetVal = scValToNative(statusResponse.returnValue);
            }
          } catch (e) {
            console.error('Error parsing transaction return value:', e);
          }
        }
        return {
          hash: txHash,
          returnValue: nativeRetVal,
        };
      } else if (statusResponse.status === 'FAILED') {
        throw new Error(`Contract invocation failed on-chain. Result XDR: ${statusResponse.resultXdr}`);
      }
      pollAttempts++;
    }

    throw new Error('Transaction polling timed out. Please check Stellar.Expert for status.');
  } catch (error) {
    console.error(`Contract invocation failure (${methodName}):`, error);
    throw new Error(getErrorMessage(error));
  }
};
