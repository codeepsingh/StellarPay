import React, { useState } from 'react';
import { Wallet, Copy, Check, Download, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { shortenAddress } from '../utils/formatters';
import { toast } from 'react-hot-toast';

/**
 * WalletCard component - manages connection displays and Freighter installations
 * @param {Object} props
 * @param {Object} props.wallet - The custom wallet state object
 */
const WalletCard = ({ wallet }) => {
  const { address, isConnected, isInstalled, connect, isLoading } = wallet;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Case 1: Freighter is not installed
  if (!isInstalled && !isLoading) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-red-200/40 dark:border-red-500/10 shadow-lg shadow-red-500/5 transition-all duration-300">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Freighter Wallet Not Found</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
              You need the Freighter browser extension to securely sign transactions on the Stellar network.
            </p>
          </div>
          
          <div className="pt-2 w-full max-w-xs space-y-2">
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download Freighter
            </a>
            <a
              href="https://developers.stellar.org/docs/tools/developer-wallets/freighter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Learn how Freighter works
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Freighter is installed but wallet is not connected
  if (!isConnected) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 shadow-lg shadow-indigo-500/5 transition-all duration-300">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Connect Your Wallet</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
              Connect your Freighter extension wallet to view your balance and send test transactions.
            </p>
          </div>
          <button
            onClick={connect}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full max-w-xs py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold shadow-md shadow-indigo-600/10 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Connected
  return (
    <div className="glass-panel p-6 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/5 shadow-lg shadow-emerald-500/5 transition-all duration-300">
      <div className="space-y-4">
        {/* Header section with connection indicators */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Wallet Account</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                Freighter Wallet
                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </h4>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Connected
          </span>
        </div>

        {/* Address and details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/50 space-y-2">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Stellar Address</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm text-slate-700 dark:text-zinc-300 break-all select-all select-none">
              {shortenAddress(address, 10)}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Info footer */}
        <div className="flex justify-between items-center text-xs text-slate-400 dark:text-zinc-500 font-semibold px-1">
          <span>Stellar Test Network</span>
          <span className="text-indigo-600 dark:text-indigo-400">Freighter Active</span>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
