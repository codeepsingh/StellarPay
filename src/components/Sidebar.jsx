import React from 'react';
import { LayoutDashboard, Send, Droplet, History, ExternalLink, HelpCircle, ShieldCheck, Award, Users } from 'lucide-react';

/**
 * Sidebar component - renders navigation options for the dashboard
 * @param {Object} props
 * @param {string} props.activeSection - Currently selected section
 * @param {Function} props.setActiveSection - Section switch handler
 */
const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'send', name: 'Send XLM', icon: Send },
    { id: 'escrows', name: 'Escrow Accounts', icon: ShieldCheck },
    { id: 'reputation', name: 'Reputation & Rankings', icon: Award },
    { id: 'faucet', name: 'Get Testnet XLM', icon: Droplet },
    { id: 'activity', name: 'Recent Activity', icon: History },
    { id: 'testing', name: 'User Testing', icon: Users },
  ];


  return (
    <aside className="w-64 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-between p-4 border-r border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 transition-colors duration-300">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Main Menu
          </p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 dark:shadow-indigo-600/5'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'opacity-70'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Stellar Resources link box at bottom of sidebar */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 border border-indigo-500/10 dark:border-indigo-500/5 space-y-2">
        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          Stellar Resources
        </h5>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
          Stellar Testnet is a free network for developers to test smart contracts and integrations.
        </p>
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
    </aside>
  );
};

export default Sidebar;
