import React, { useState } from 'react';
import { History, ExternalLink, Copy, Check, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { shortenAddress, formatDate } from '../utils/formatters';
import { toast } from 'react-hot-toast';

/**
 * ActivityTable component - displays past transaction logs.
 * @param {Object} props
 * @param {Array} props.history - List of transactions
 * @param {Function} props.onClear - Handler to clear all history records
 */
const ActivityTable = ({ history = [], onClear }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyHash = (hash, id) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    toast.success('Hash copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getExplorerLink = (hash) => {
    if (!hash || hash.startsWith('failed_')) return '#';
    return `https://stellar.expert/explorer/testnet/tx/${hash}`;
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md overflow-hidden transition-all duration-300">
      
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Recent Activity</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Your local transaction history on Stellar Testnet.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center justify-center space-y-2">
          <History className="w-12 h-12 opacity-30 animate-pulse-subtle" />
          <h4 className="font-semibold text-sm">No transaction records found</h4>
          <p className="text-xs opacity-80 max-w-xs">
            Send native XLM or fund your wallet to start tracking transactions here.
          </p>
        </div>
      ) : (
        /* Scrollable container for tables/cards */
        <div className="max-h-96 overflow-y-auto">
          
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-zinc-900/50 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-200/40 dark:border-zinc-800/40">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Tx Hash</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs">
                {history.map((tx) => {
                  const isSuccess = tx.status?.toLowerCase() === 'success';
                  const hasHash = tx.hash && !tx.hash.startsWith('failed_');
                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(tx.timestamp)}
                      </td>
                      
                      {/* Recipient */}
                      <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-zinc-300">
                        {shortenAddress(tx.recipient, 6)}
                      </td>
                      
                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {tx.amount} XLM
                      </td>
                      
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isSuccess 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isSuccess ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {tx.status}
                        </span>
                      </td>
                      
                      {/* Hash (Shortened) */}
                      <td className="py-3.5 px-4 text-center">
                        {hasHash ? (
                          <button
                            onClick={() => handleCopyHash(tx.hash, tx.id)}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-zinc-800/60 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            title="Copy Hash"
                          >
                            <span>{shortenAddress(tx.hash, 4)}</span>
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600">—</span>
                        )}
                      </td>
                      
                      {/* Explorer Link */}
                      <td className="py-3.5 px-4 text-right">
                        {hasHash ? (
                          <a
                            href={getExplorerLink(tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold transition-colors"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span 
                            className="text-[10px] text-rose-500 font-semibold cursor-help"
                            title={tx.error || 'Transaction failed.'}
                          >
                            Failed details
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-List View */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-zinc-800/50 p-2">
            {history.map((tx) => {
              const isSuccess = tx.status?.toLowerCase() === 'success';
              const hasHash = tx.hash && !tx.hash.startsWith('failed_');
              return (
                <div key={tx.id} className="p-3 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                      {formatDate(tx.timestamp)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      isSuccess 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Recipient</p>
                      <p className="font-mono text-slate-800 dark:text-zinc-300 font-semibold mt-0.5">
                        {shortenAddress(tx.recipient, 8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Amount</p>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {tx.amount} XLM
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  {hasHash && (
                    <div className="flex justify-between items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopyHash(tx.hash, tx.id)}
                        className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-medium text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
                      >
                        {copiedId === tx.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Hash Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 opacity-65" />
                            Copy Hash ({shortenAddress(tx.hash, 4)})
                          </>
                        )}
                      </button>

                      <a
                        href={getExplorerLink(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-500/10"
                      >
                        View block explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {!hasHash && tx.error && (
                    <div className="p-2 rounded bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-500 font-semibold leading-relaxed">
                      {tx.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};

export default ActivityTable;
