import React from 'react';
import { CheckCircle2, XCircle, ExternalLink, ArrowLeft, RotateCcw, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { shortenAddress, formatDate } from '../utils/formatters';
import { toast } from 'react-hot-toast';

/**
 * TransactionResult component - shows transaction outcome (success or error).
 * @param {Object} props
 * @param {Object} props.result - { success: boolean, data?: Object, error?: string }
 * @param {Function} props.onReset - Callback to clear result and go back to form
 */
const TransactionResult = ({ result, onReset }) => {
  const [copied, setCopied] = React.useState(false);
  if (!result) return null;

  const { success, data, error } = result;

  const handleCopyHash = () => {
    if (!data?.hash) return;
    navigator.clipboard.writeText(data.hash);
    setCopied(true);
    toast.success('Transaction Hash copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Case 1: Transaction Successful
  if (success && data) {
    const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${data.hash}`;
    return (
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/10 shadow-lg shadow-emerald-500/5 text-center space-y-6 transition-all duration-300">
        
        {/* Animated Checkmark */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
        </div>

        {/* Status Texts */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100">Transaction Confirmed</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Your payment has been written to the Stellar Testnet ledger.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/60 text-left space-y-3 text-xs">
          
          <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-zinc-800/40">
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Amount</span>
            <span className="font-extrabold text-slate-800 dark:text-zinc-200">{data.amount} XLM</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-zinc-800/40">
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Recipient</span>
            <span className="font-mono text-slate-700 dark:text-zinc-300">{shortenAddress(data.recipient, 6)}</span>
          </div>

          {data.memo && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-zinc-800/40">
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">Memo</span>
              <span className="text-slate-700 dark:text-zinc-300 italic font-medium">{data.memo}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-zinc-800/40">
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Timestamp</span>
            <span className="text-slate-700 dark:text-zinc-300 font-medium">{formatDate(data.timestamp)}</span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-slate-400 dark:text-zinc-500 font-semibold block">Transaction Hash</span>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80">
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 break-all select-all">
                {data.hash}
              </span>
              <button
                onClick={handleCopyHash}
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
                title="Copy hash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 flex-1 rounded-xl text-sm font-semibold border border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Send Another Payment
          </button>
          
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 flex-1 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            View in Explorer
          </a>
        </div>

      </div>
    );
  }

  // Case 2: Transaction Failed
  return (
    <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 dark:border-rose-500/10 shadow-lg shadow-rose-500/5 text-center space-y-6 transition-all duration-300">
      
      {/* Animated X-Mark */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500"
        >
          <XCircle className="w-10 h-10" />
        </motion.div>
      </div>

      {/* Status Texts */}
      <div className="space-y-1">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100">Transaction Failed</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          The Stellar network rejected the payment.
        </p>
      </div>

      {/* Error Details */}
      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-left space-y-1">
        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Failure Reason</span>
        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-semibold">
          {error || 'An unknown network error occurred. Please verify your address and try again.'}
        </p>
      </div>

      {/* Action */}
      <button
        onClick={onReset}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again / Retry
      </button>

    </div>
  );
};

export default TransactionResult;
