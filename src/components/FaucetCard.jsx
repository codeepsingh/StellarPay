import React, { useState } from 'react';
import { Droplet, ExternalLink, Copy, Check, RefreshCw, Zap, Compass } from 'lucide-react';
import { shortenAddress } from '../utils/formatters';
import { toast } from 'react-hot-toast';

/**
 * FaucetCard component - provides Stellar Testnet faucet funding controls.
 * @param {Object} props
 * @param {Object} props.wallet - The custom wallet state object
 */
const FaucetCard = ({ wallet }) => {
  const { address, isConnected, isFunding, fundWallet, refreshBalance, isLoading } = wallet;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFaucet = () => {
    // Open the Stellar Testnet laboratory faucet link
    const url = `https://laboratory.stellar.org/#account-creator?network=test`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Stellar Laboratory Faucet opened in a new tab.');
  };

  const handleManualRefresh = () => {
    refreshBalance();
  };

  // Guide Steps definition
  const steps = [
    { number: '1', title: 'Copy Address', desc: 'Copy your connected wallet address to your clipboard.' },
    { number: '2', title: 'Open Faucet', desc: 'Go to the Stellar laboratory faucet page.' },
    { number: '3', title: 'Request XLM', desc: 'Paste your address and request free Testnet XLM.' },
    { number: '4', title: 'Refresh Balance', desc: 'Return here and click refresh to verify funding.' },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md transition-all duration-300">
      <div className="space-y-6">
        
        {/* Title and Badge */}
        <div className="flex justify-between items-start">
          <div className="space-y-1 text-left">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
              <Droplet className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
              Get Testnet XLM
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Fund your wallet with free Stellar Testnet XLM for testing transactions.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
            Faucet
          </span>
        </div>

        {/* Faucet actions (Auto / Manual) */}
        {!isConnected ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-slate-400 dark:text-zinc-500">
            <p className="text-sm font-semibold">Connect wallet to enable faucet funding</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Quick Auto Faucet Button (Developer Superpower) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 dark:border-indigo-500/10 text-left space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                  Option A: Quick Funding
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Request 10,000 testnet XLM directly to your account.
                </p>
              </div>
              <button
                onClick={fundWallet}
                disabled={isFunding || isLoading}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-indigo-400/80 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {isFunding ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Funding...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Auto-Fund Wallet (10K XLM)
                  </>
                )}
              </button>
            </div>

            {/* Manual Funding Guide */}
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-500" />
                Option B: Manual Funding Guide
              </h4>

              {/* Grid of Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {steps.map((step) => (
                  <div 
                    key={step.number} 
                    className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/20"
                  >
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">
                        {step.number}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{step.title}</h5>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 flex-1 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Address Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 opacity-70" />
                      Copy Address ({shortenAddress(address, 4)})
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenFaucet}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 flex-1 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Faucet Page
                </button>

                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                  title="Check Balance"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default FaucetCard;
