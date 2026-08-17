import React from 'react';
import { ArrowRight, Wallet, Shield, Zap, RefreshCw, BarChart2 } from 'lucide-react';

/**
 * Landing page component - welcomes users and offers wallet connection trigger.
 * @param {Object} props
 * @param {Object} props.wallet - The custom wallet state object
 * @param {Function} props.onEnterDashboard - Callback to enter dashboard page
 */
const Landing = ({ wallet, onEnterDashboard }) => {
  const { isConnected, connect, isLoading } = wallet;

  const handleStart = () => {
    if (isConnected) {
      onEnterDashboard();
    } else {
      connect();
    }
  };

  const keyFeatures = [
    {
      icon: Shield,
      title: 'Freighter Wallet Security',
      desc: 'Sign transactions securely in your browser using Stellar\'s primary non-custodial wallet extension.',
    },
    {
      icon: Zap,
      title: 'Instant Stellar Testnet Transactions',
      desc: 'Send payments that settle in under 5 seconds with near-zero transaction fees.',
    },
    {
      icon: RefreshCw,
      title: 'Integrated Testnet Faucet',
      desc: 'Fund or reactivate your account in one click via direct Friendbot integration.',
    },
    {
      icon: BarChart2,
      title: 'Activity Tracking',
      desc: 'Keep track of your transaction history locally with clickable block explorer links.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-600/10 dark:bg-cyan-500/10 rounded-full blur-3xl -z-10" />

      {/* Hero Section */}
      <div className="max-w-4xl text-center space-y-8 mt-4 md:mt-8">
        
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
            Modern Payments on <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              Stellar Testnet
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            StellarPay is a fully functional Web3 application for managing your testnet balances, requesting faucet funding, and sending rapid native XLM payments.
          </p>
        </div>

        {/* Call to Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold text-base shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isConnected ? (
              <>
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect Freighter Wallet
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Visual Mockup Frame / App Preview Card */}
        <div className="pt-10 max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-sm">
            <div className="rounded-xl border border-slate-200/50 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col aspect-video md:aspect-[21/9] justify-center items-center p-6 space-y-4">
              <img src="/logo.png" alt="StellarPay" className="w-20 h-20 object-contain" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 text-lg">StellarPay Dashboard</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Connect Freighter to inspect wallet status and balances</p>
              </div>
              {!isConnected && (
                <button
                  onClick={connect}
                  className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  Quick Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 mt-12 border-t border-slate-200/50 dark:border-zinc-900">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Why StellarPay?</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Built using the core principles of the Stellar ecosystem.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyFeatures.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i} 
                className="p-5 rounded-2xl border border-slate-200/40 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/10 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300 flex flex-col items-start text-left space-y-3"
              >
                <div className="p-3 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{feat.title}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Landing;
