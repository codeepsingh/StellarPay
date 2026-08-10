import { useState, useEffect, useCallback } from 'react';
import { Keypair } from 'stellar-sdk';
import {
  checkFreighterInstalled,
  getFreighterPublicKey,
  fetchAccountDetails,
  fundAccountWithFriendbot,
  verifyTestnetNetwork,
} from '../services/stellarService';
import {
  getTransactionHistory,
  saveTransaction,
  clearTransactionHistory,
} from '../services/transactionService';
import { toast } from 'react-hot-toast';

export const useWallet = () => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0.0000');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'freighter', 'albedo', 'xbull'
  const [isFunded, setIsFunded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState(null);
  const [txHistory, setTxHistory] = useState([]);

  // Check Freighter installation on mount and load active wallet type
  useEffect(() => {
    const checkInstallation = async () => {
      const installed = await checkFreighterInstalled();
      setIsInstalled(installed);
      
      const savedWalletType = localStorage.getItem('stellarpay_wallet_type');
      const savedAddress = localStorage.getItem('stellarpay_address');
      
      if (savedWalletType && savedAddress) {
        setWalletType(savedWalletType);
        if (savedWalletType === 'freighter') {
          if (installed) {
            autoConnectFreighter(savedAddress);
          } else {
            setIsLoading(false);
          }
        } else {
          // Auto connect sandbox wallet
          setAddress(savedAddress);
          setIsConnected(true);
          await loadAccountInfo(savedAddress);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkInstallation();
    setTxHistory(getTransactionHistory());
  }, []);

  // Fetch address details
  const loadAccountInfo = useCallback(async (publicKey) => {
    setError(null);
    try {
      const details = await fetchAccountDetails(publicKey);
      setBalance(details.balance);
      setIsFunded(details.isFunded);
      return details;
    } catch (err) {
      console.error('Failed to load account details:', err);
      setError(err.message || 'Failed to retrieve balance.');
      return null;
    }
  }, []);

  // Auto connect freighter helper
  const autoConnectFreighter = async (savedAddress) => {
    setIsLoading(true);
    try {
      const isTestnet = await verifyTestnetNetwork();
      if (!isTestnet) {
        setError('Freighter is not on Testnet. Please open Freighter and switch networks.');
        setIsLoading(false);
        return;
      }
      setAddress(savedAddress);
      setIsConnected(true);
      await loadAccountInfo(savedAddress);
    } catch (err) {
      console.error('Auto connect failed:', err);
      localStorage.removeItem('stellarpay_address');
      localStorage.removeItem('stellarpay_wallet_type');
    } finally {
      setIsLoading(false);
    }
  };

  // Connect Wallet
  const connect = async (selectedType = null) => {
    if (selectedType && typeof selectedType !== 'string') {
      selectedType = null;
    }
    if (!selectedType) {
      setIsSelectorOpen(true);
      return;
    }


    setIsLoading(true);
    setError(null);
    setIsSelectorOpen(false);

    try {
      if (selectedType === 'freighter') {
        const installed = await checkFreighterInstalled();
        if (!installed) {
          throw new Error('Freighter wallet is not installed. Please install the browser extension.');
        }

        const isTestnet = await verifyTestnetNetwork();
        if (!isTestnet) {
          throw new Error('Incorrect network. Please switch Freighter Wallet network to Stellar Testnet.');
        }

        const pubKey = await getFreighterPublicKey();
        setAddress(pubKey);
        setWalletType('freighter');
        setIsConnected(true);
        localStorage.setItem('stellarpay_address', pubKey);
        localStorage.setItem('stellarpay_wallet_type', 'freighter');
        await loadAccountInfo(pubKey);
        toast.success('Freighter Wallet connected successfully!');
      } else {
        // Sandbox Albedo/xBull Wallet Setup
        let pubKey = localStorage.getItem(`stellarpay_addr_${selectedType}`);
        let secret = localStorage.getItem(`stellarpay_sec_${selectedType}`);

        if (!pubKey || !secret) {
          // Generate new Testnet keypair
          const kp = Keypair.random();
          pubKey = kp.publicKey();
          secret = kp.secret();

          // Fund it via Friendbot
          const fundingToast = toast.loading(`Generating & funding simulated ${selectedType === 'albedo' ? 'Albedo' : 'xBull'} account on Testnet...`);
          try {
            await fundAccountWithFriendbot(pubKey);
            toast.dismiss(fundingToast);
          } catch (fundErr) {
            toast.dismiss(fundingToast);
            throw new Error('Failed to fund simulated wallet account via Friendbot. Please try again.');
          }

          localStorage.setItem(`stellarpay_addr_${selectedType}`, pubKey);
          localStorage.setItem(`stellarpay_sec_${selectedType}`, secret);
        }

        setAddress(pubKey);
        setWalletType(selectedType);
        setIsConnected(true);
        localStorage.setItem('stellarpay_address', pubKey);
        localStorage.setItem('stellarpay_wallet_type', selectedType);
        
        await loadAccountInfo(pubKey);
        toast.success(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} wallet connected successfully!`);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet.');
      toast.error(err.message || 'Connection failed.');
      setIsConnected(false);
      setWalletType(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect Wallet
  const disconnect = () => {
    setAddress('');
    setBalance('0.0000');
    setWalletType(null);
    setIsFunded(false);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem('stellarpay_address');
    localStorage.removeItem('stellarpay_wallet_type');
    toast.success('Wallet disconnected.');
  };

  // Refresh Balance
  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      if (walletType === 'freighter') {
        const isTestnet = await verifyTestnetNetwork();
        if (!isTestnet) {
          toast.error('Freighter network is not on Testnet. Please change the network.');
          setIsLoading(false);
          return;
        }
      }
      
      await loadAccountInfo(address);
      toast.success('Balance refreshed.');
    } catch (err) {
      console.error('Error refreshing balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, walletType, loadAccountInfo]);

  // Fund Wallet Faucet
  const fundWallet = async () => {
    if (!address) {
      toast.error('Connect your wallet first.');
      return;
    }
    
    setIsFunding(true);
    const loadingToast = toast.loading('Requesting testnet XLM from Friendbot...');
    
    try {
      await fundAccountWithFriendbot(address);
      toast.dismiss(loadingToast);
      toast.success('Account funded successfully! 10,000 XLM added.');
      await loadAccountInfo(address);
    } catch (err) {
      console.error('Funding failed:', err);
      toast.dismiss(loadingToast);
      toast.error('Faucet request failed. Try again shortly.');
    } finally {
      setIsFunding(false);
    }
  };

  const addTransaction = (tx) => {
    const updated = saveTransaction(tx);
    setTxHistory(updated);
  };

  const clearHistory = () => {
    const updated = clearTransactionHistory();
    setTxHistory(updated);
    toast.success('Activity history cleared.');
  };

  return {
    address,
    balance,
    isSelectorOpen,
    setIsSelectorOpen,
    walletType,
    isFunded,
    isConnected,
    isInstalled,
    isLoading,
    isFunding,
    error,
    txHistory,
    connect,
    disconnect,
    refreshBalance,
    fundWallet,
    addTransaction,
    clearHistory,
  };
};
