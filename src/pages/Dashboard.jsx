import React, { useState } from 'react';
import { Menu, X, LayoutDashboard, Send, Droplet, History, ShieldCheck, Award, HelpCircle, ExternalLink } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WalletCard from '../components/WalletCard';
import BalanceCard from '../components/BalanceCard';
import FaucetCard from '../components/FaucetCard';
import SendPaymentForm from '../components/SendPaymentForm';
import TransactionResult from '../components/TransactionResult';
import ActivityTable from '../components/ActivityTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EscrowPanel from '../components/EscrowPanel';
import ReputationPanel from '../components/ReputationPanel';
import EventFeed from '../components/EventFeed';
import { UserTestingPanel } from '../components/UserTestingPanel';

/**
 * Dashboard page - aggregates and renders all wallet dashboard sub-sections.
 * @param {Object} props
 * @param {Object} props.wallet - The custom wallet hook state object
 */
const Dashboard = ({ wallet }) => {
  const { isConnected, txHistory, clearHistory } = wallet;
  const [activeSection, setActiveSection] = useState('overview'); // overview, send, escrows, reputation, faucet, activity
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txResult, setTxResult] = useState(null); // null, or { success: boolean, data?: Object, error?: string }

  const handleTransactionStart = () => {
    setTxLoading(true);
    setTxResult(null);
  };

  const handleTransactionResult = (result) => {
    setTxLoading(false);
    setTxResult(result);
  };

  const handleResultReset = () => {
    setTxResult(null);
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-300">
        <div className="max-w-md text-center p-6 glass-panel rounded-2xl border border-indigo-500/10 shadow-lg">
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">Access Denied</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            Please connect your wallet to view the dashboard contents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex transition-colors duration-300">

      {/* Desktop Navigation Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

        {/* Mobile Header Bar with Hamburger Menu */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-850 dark:text-zinc-100 text-sm">
              {activeSection === 'overview' && 'Overview'}
              {activeSection === 'send' && 'Send XLM'}
              {activeSection === 'escrows' && 'Escrow Accounts'}
              {activeSection === 'reputation' && 'Reputation & Rankings'}
              {activeSection === 'faucet' && 'Get Testnet XLM'}
              {activeSection === 'activity' && 'Recent Activity'}
              {activeSection === 'testing' && 'User Testing'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 dark:bg-amber-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Testnet
          </div>
        </div>

        {/* Mobile Menu Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex flex-col w-72 max-w-xs h-full bg-white dark:bg-zinc-950 p-6 shadow-2xl border-r border-slate-200/60 dark:border-zinc-800/80 animate-slide-in">
              {/* Close Button */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">StellarPay Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 space-y-1">
                {[
                  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
                  { id: 'send', name: 'Send XLM', icon: Send },
                  { id: 'escrows', name: 'Escrow Accounts', icon: ShieldCheck },
                  { id: 'reputation', name: 'Reputation & Rankings', icon: Award },
                  { id: 'faucet', name: 'Get Testnet XLM', icon: Droplet },
                  { id: 'activity', name: 'Recent Activity', icon: History },
                  { id: 'testing', name: 'User Testing', icon: HelpCircle },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'opacity-70'}`} />
                      {item.name}
                    </button>
                  );
                })}
              </nav>

              {/* Resources / Footer inside Drawer */}
              <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 border border-indigo-500/10 dark:border-indigo-500/5 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  Stellar Resources
                </h5>
                <a
                  href="https://developers.stellar.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Developer Docs
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Transaction submission loading screen override */}
        {txLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center glass-panel rounded-2xl border border-indigo-500/10">
            <LoadingSpinner size="lg" text="Submitting transaction. Please approve and sign inside your wallet and wait for ledger confirmation..." />
          </div>
        ) : (
          <div className="space-y-6">

            {/* View A: Overview (Multi-column Dashboard Layout) */}
            {activeSection === 'overview' && (
              <div className="space-y-6">

                {/* Upper Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <WalletCard wallet={wallet} />
                    <BalanceCard wallet={wallet} />
                  </div>
                  <div>
                    {txResult ? (
                      <TransactionResult result={txResult} onReset={handleResultReset} />
                    ) : (
                      <SendPaymentForm
                        wallet={wallet}
                        onTransactionStart={handleTransactionStart}
                        onTransactionResult={handleTransactionResult}
                      />
                    )}
                  </div>
                </div>

                {/* Live Event Stream and Activity split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EventFeed />
                  <ActivityTable history={txHistory} onClear={clearHistory} />
                </div>

                {/* Faucet Box */}
                <FaucetCard wallet={wallet} />

              </div>
            )}

            {/* View B: Send Payment Section */}
            {activeSection === 'send' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <BalanceCard wallet={wallet} />
                  <WalletCard wallet={wallet} />
                </div>
                <div className="lg:col-span-2">
                  {txResult ? (
                    <TransactionResult result={txResult} onReset={handleResultReset} />
                  ) : (
                    <SendPaymentForm
                      wallet={wallet}
                      onTransactionStart={handleTransactionStart}
                      onTransactionResult={handleTransactionResult}
                    />
                  )}
                </div>
              </div>
            )}

            {/* View C: Escrow Accounts Section */}
            {activeSection === 'escrows' && (
              <EscrowPanel wallet={wallet} />
            )}

            {/* View D: Reputation & Leaderboard Section */}
            {activeSection === 'reputation' && (
              <ReputationPanel wallet={wallet} />
            )}

            {/* View E: Faucet Funding Section */}
            {activeSection === 'faucet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <BalanceCard wallet={wallet} />
                  <WalletCard wallet={wallet} />
                </div>
                <div className="lg:col-span-2">
                  <FaucetCard wallet={wallet} />
                </div>
              </div>
            )}

            {/* View F: Recent Activity Section */}
            {activeSection === 'activity' && (
              <div className="space-y-6">
                <ActivityTable history={txHistory} onClear={clearHistory} />
              </div>
            )}

            {/* View G: User Testing Section */}
            {activeSection === 'testing' && (
              <UserTestingPanel wallet={wallet} />
            )}

          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
