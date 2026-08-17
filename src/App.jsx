import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from './hooks/useWallet';
import { useTheme } from './hooks/useTheme';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import WalletSelectorModal from './components/WalletSelectorModal';
import { HelpCircle, ExternalLink } from 'lucide-react';

function App() {
  const wallet = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState('landing');


  // Automatic routing based on wallet connection state
  useEffect(() => {
    if (wallet.isConnected) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('landing');
    }
  }, [wallet.isConnected]);

  const handleNavigate = (page) => {
    if (page === 'dashboard' && !wallet.isConnected) {
      wallet.connect();
      return;
    }
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Wallet Selector Modal */}
      <WalletSelectorModal 
        isOpen={wallet.isSelectorOpen} 
        onClose={() => wallet.setIsSelectorOpen(false)} 
        onSelect={(type) => wallet.connect(type)} 
      />

      {/* Toast Notification Provider */}
      <Toaster 
        position="top-right" 

        reverseOrder={false}
        toastOptions={{
          className: 'glass-card border border-slate-200/60 dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:text-white',
          style: {
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '600',
          }
        }} 
      />

      {/* Navigation Header */}
      <Navbar 
        wallet={wallet} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'dashboard' && wallet.isConnected ? (
          <Dashboard wallet={wallet} />
        ) : (
          <Landing wallet={wallet} onEnterDashboard={() => setCurrentPage('dashboard')} />
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 text-center text-xs text-slate-400 dark:text-zinc-500 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-zinc-400">StellarPay</span>
            <span>&copy; {new Date().getFullYear()} - Built for Stellar White Belt submission.</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://laboratory.stellar.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              Stellar Laboratory
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://www.stellar.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              Stellar.org
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
