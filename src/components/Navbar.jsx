import React, { useState } from 'react';
import { Wallet, LogOut, Copy, Check, ShieldAlert } from 'lucide-react';
import { shortenAddress } from '../utils/formatters';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { toast } from 'react-hot-toast';


const Navbar = ({ wallet, theme, toggleTheme, onNavigate, currentPage }) => {
  const { address, isConnected, connect, disconnect } = wallet;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <img 
              src="/logo.png" 
              alt="StellarPay" 
              className="w-10 h-10 object-contain"
            />
            <span className="font-extrabold text-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-white dark:via-indigo-200 dark:to-cyan-200 bg-clip-text text-transparent tracking-tight">
              StellarPay
            </span>
          </div>

          {/* Navigation Links for Desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onNavigate('landing')}
              className={`transition-colors duration-200 ${
                currentPage === 'landing'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Home
            </button>
            {isConnected && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`transition-colors duration-200 ${
                  currentPage === 'dashboard'
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Dashboard
              </button>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Network Badge */}
            {isConnected && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 dark:bg-amber-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Testnet
              </div>
            )}

            {/* Address Display (if connected) */}
            {isConnected && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{shortenAddress(address, 5)}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                  )}
                </button>
              </div>
            )}

            {/* Notification Bell */}
            {isConnected && <NotificationBell address={address} />}

            {/* Theme Toggle */}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />


            {/* Wallet Connect/Disconnect button */}
            {isConnected ? (
              <button
                onClick={disconnect}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-rose-500/30 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            ) : (
              <button
                onClick={connect}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
