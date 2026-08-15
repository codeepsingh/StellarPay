import React, { useState, useEffect } from 'react';
import { ShieldCheck, HelpCircle, RefreshCw, ExternalLink, Zap, Lock, Unlock, AlertTriangle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { shortenAddress } from '../utils/formatters';

const EventFeed = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await apiService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStyle = (type) => {
    switch (type) {
      case 'Escrow Created':
        return {
          bg: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20',
          icon: Lock,
          iconColor: 'text-emerald-500',
          label: 'Funded'
        };
      case 'Escrow Released':
        return {
          bg: 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20',
          icon: Unlock,
          iconColor: 'text-indigo-500',
          label: 'Released'
        };
      case 'Escrow Refunded':
        return {
          bg: 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20',
          icon: AlertCircle,
          iconColor: 'text-amber-500',
          label: 'Refunded'
        };
      case 'Escrow Cancelled':
        return {
          bg: 'bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/20',
          icon: XCircle,
          iconColor: 'text-slate-500',
          label: 'Cancelled'
        };
      case 'Escrow Disputed':
        return {
          bg: 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20',
          icon: AlertTriangle,
          iconColor: 'text-rose-500',
          label: 'Disputed'
        };
      case 'Dispute Resolved':
        return {
          bg: 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20',
          icon: ShieldCheck,
          iconColor: 'text-indigo-500',
          label: 'Resolved'
        };
      default:
        return {
          bg: 'bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/20',
          icon: HelpCircle,
          iconColor: 'text-slate-500',
          label: 'Info'
        };
    }
  };

  const XCircle = ({ className }) => <span className={`inline-block ${className}`}>✖</span>;

  return (
    <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-indigo-500 animate-pulse" />
            Live Soroban Event Stream
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            Real-time feed of platform on-chain smart contract updates
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-slate-400"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mr-1.5 align-middle" />
          Connecting to event indexer...
        </div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
          No platform activities logged yet
        </p>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {events.slice(0, 10).map((ev) => {
            const style = getEventStyle(ev.type);
            const Icon = style.icon;
            
            return (
              <div
                key={ev._id}
                className={`p-3 rounded-2xl border ${style.bg} flex items-start justify-between gap-3 text-xs`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/40 dark:border-zinc-800/80 ${style.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">
                        {ev.type}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                        (Ledger #{ev.ledger})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                      {ev.type === 'Escrow Created' && `Escrow #${ev.value.escrowId} created by ${shortenAddress(ev.value.creator, 5)} for ${ev.value.amount} XLM.`}
                      {ev.type === 'Escrow Released' && `Funds from Escrow #${ev.value.escrowId} released to recipient.`}
                      {ev.type === 'Escrow Refunded' && `Funds from Escrow #${ev.value.escrowId} refunded to creator.`}
                      {ev.type === 'Escrow Cancelled' && `Escrow #${ev.value.escrowId} cancelled by creator.`}
                      {ev.type === 'Escrow Disputed' && `Dispute raised on Escrow #${ev.value.escrowId}: "${ev.value.reason}".`}
                      {ev.type === 'Dispute Resolved' && `Dispute resolved in favor of ${shortenAddress(ev.value.winner, 5)}.`}
                    </p>
                  </div>
                </div>

                {ev.txHash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${ev.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors shrink-0"
                    title="View Transaction"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventFeed;
