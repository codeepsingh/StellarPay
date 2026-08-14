import React from 'react';
import { X, Shield, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WalletSelectorModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const walletOptions = [
    {
      id: 'freighter',
      name: 'Freighter Wallet',
      description: 'Stellar\'s official browser extension wallet.',
      icon: Shield,
      badge: 'Extension',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      isInstalled: typeof window !== 'undefined' && !!window.stellarPubKey
    },
    {
      id: 'albedo',
      name: 'Albedo Wallet',
      description: 'Standard Stellar web wallet (Sandbox Dev Mode).',
      icon: CheckCircle2,
      badge: 'Sandbox Mode',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      isInstalled: true
    },
    {
      id: 'xbull',
      name: 'xBull Wallet',
      description: 'Advanced power-user Stellar wallet (Sandbox Dev Mode).',
      icon: Zap,
      badge: 'Sandbox Mode',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      isInstalled: true
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                Connect Wallet
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Choose how you want to connect to Stellar Testnet
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-400 dark:text-zinc-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning info */}
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400/80 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              Sandbox mode wallets generate fully functional, real-world Stellar Testnet credentials locally. You can use Friendbot to fund them instantly!
            </p>
          </div>

          {/* Wallet List */}
          <div className="space-y-3">
            {walletOptions.map((wallet) => {
              const Icon = wallet.icon;
              return (
                <button
                  key={wallet.id}
                  onClick={() => onSelect(wallet.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-slate-50/50 hover:bg-indigo-50/40 dark:bg-zinc-950/20 dark:hover:bg-zinc-800/40 text-left transition-all active:scale-98 group cursor-pointer hover:border-indigo-500/30"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                        {wallet.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal max-w-[240px]">
                        {wallet.description}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${wallet.badgeColor}`}>
                    {wallet.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletSelectorModal;
