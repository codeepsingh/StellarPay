import React from 'react';
import { RefreshCw, Coins, Info, AlertCircle } from 'lucide-react';
import { formatXLM } from '../utils/formatters';

/**
 * BalanceCard component - displays current account balance and status.
 * @param {Object} props
 * @param {Object} props.wallet - The custom wallet state object
 */
const BalanceCard = ({ wallet }) => {
  const { balance, isFunded, isConnected, isLoading, refreshBalance, error } = wallet;

  const handleRefresh = (e) => {
    e.preventDefault();
    if (isLoading) return;
    refreshBalance();
  };

  // Case 1: Wallet is not connected
  if (!isConnected) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-zinc-500">
          <Coins className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm font-semibold">Connect wallet to view balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md relative overflow-hidden transition-all duration-300">
      
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Available Balance
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer ${
              isLoading ? 'animate-spin' : ''
            }`}
            title="Refresh balance"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="space-y-1">
          {isLoading ? (
            /* Skeleton Loader */
            <div className="space-y-2 py-1">
              <div className="h-9 w-40 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-zinc-900 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="py-2 text-rose-500 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to load balance</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatXLM(balance)}
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                XLM
              </span>
            </div>
          )}
        </div>

        {/* Account activation warning (if not funded on-chain) */}
        {!isLoading && isConnected && !isFunded && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-1.5 transition-all">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h5 className="text-xs font-bold">Account Inactive (Unfunded)</h5>
                <p className="text-[11px] leading-relaxed opacity-95">
                  This address is not active on the Stellar Testnet ledger. A minimum of 1 XLM is required to register and activate it.
                </p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-left pl-6">
              💡 Use the Testnet Faucet below to fund and activate your wallet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceCard;
