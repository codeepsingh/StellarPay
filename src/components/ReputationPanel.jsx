import React, { useState, useEffect } from 'react';
import { Award, Search, Sparkles, TrendingUp, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'react-hot-toast';
import { shortenAddress } from '../utils/formatters';

const ReputationPanel = ({ wallet }) => {
  const { address } = wallet;
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchAddr, setSearchAddr] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    setLoading(true);
    try {
      // Load user profile
      const prof = await apiService.getUserProfile(address);
      setProfile(prof);

      // Load analytics to get leaderboard rankings
      const analytics = await apiService.getAnalytics();
      setLeaderboard(analytics.rankings || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reputation details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchAddr.trim()) return;

    setSearching(true);
    setSearchResult(null);
    try {
      const result = await apiService.getUserProfile(searchAddr.trim());
      setSearchResult(result);
    } catch (error) {
      console.error(error);
      toast.error('User profile not found or invalid address');
    } finally {
      setSearching(false);
    }
  };

  // Helper to get score badge
  const getBadge = (score) => {
    if (score >= 250) return { name: 'Stellar Archon', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
    if (score >= 150) return { name: 'Soroban Master', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (score >= 110) return { name: 'Elite Partner', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' };
    if (score >= 100) return { name: 'Pioneer', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { name: 'Novice', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
        <span className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin inline-block mb-2" />
        <p>Loading Reputation & Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Main Stats Section */}
      {profile && (
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  Your Reputation Score
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  On-chain trust rating calculated from escrow successes
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <span className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                {profile.reputationScore}
              </span>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${getBadge(profile.reputationScore).color}`}>
                {getBadge(profile.reputationScore).name}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Global Rank</span>
              <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">#{profile.rank || '-'}</span>
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Total Volume</span>
              <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">{parseFloat(profile.totalVolume).toFixed(2)} XLM</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Deals Completed</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {profile.completedContracts}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block">Success Rate</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {profile.successRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Global Leaderboard & Search Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Leaderboard Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                Global Trust Leaderboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Top performing escrow partners ranked by reputation score
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-400"
              title="Refresh Leaderboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold bg-slate-50/30 dark:bg-zinc-950/30">
                    <th className="p-4 w-16">Rank</th>
                    <th className="p-4">Stellar Address</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Success Rate</th>
                    <th className="p-4 text-right">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {leaderboard.map((item, index) => {
                    const isSelf = item.walletAddress === address;
                    const rank = index + 1;
                    
                    return (
                      <tr
                        key={item._id || item.walletAddress}
                        className={`hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors ${
                          isSelf ? 'bg-indigo-500/5 font-semibold' : ''
                        }`}
                      >
                        <td className="p-4 font-bold text-slate-800 dark:text-zinc-200">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-zinc-400">
                          {shortenAddress(item.walletAddress, 6)}
                          {isSelf && <span className="ml-2 text-[10px] bg-indigo-600/10 text-indigo-500 px-1.5 py-0.5 rounded">You</span>}
                        </td>
                        <td className="p-4 text-center font-extrabold text-slate-800 dark:text-zinc-100">
                          {item.reputationScore}
                        </td>
                        <td className="p-4 text-center text-slate-500 dark:text-zinc-400">
                          {item.successRate}%
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadge(item.reputationScore).color}`}>
                            {getBadge(item.reputationScore).name}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Wallet Lookup */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
              Audit Partner Reputation
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Verify the trustworthiness of a user before funding an escrow
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="G... (Stellar public key)"
                value={searchAddr}
                onChange={(e) => setSearchAddr(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={searching}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white shadow-sm cursor-pointer transition-colors active:scale-95 flex items-center justify-center"
              >
                {searching ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Audit Result Display */}
            {searchResult && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">
                    Audit Report
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadge(searchResult.reputationScore).color}`}>
                    {getBadge(searchResult.reputationScore).name}
                  </span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Reputation Score:</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">{searchResult.reputationScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Completed deals:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{searchResult.completedContracts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Failed/Refunded:</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">{searchResult.failedContracts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Success Rate:</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{searchResult.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Total Volume:</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">{parseFloat(searchResult.totalVolume).toFixed(2)} XLM</span>
                  </div>
                </div>

                {/* Recommendation indicator */}
                <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex gap-1.5 ${
                  searchResult.reputationScore >= 110
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400/90'
                    : searchResult.reputationScore >= 95
                    ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-600 dark:text-indigo-400/90'
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400/90'
                }`}>
                  {searchResult.reputationScore >= 110 ? (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <p>Recommended trust partner. High success rating and volume history.</p>
                    </>
                  ) : searchResult.reputationScore >= 95 ? (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <p>Standard trust rating. Safe for escrow operations.</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      <p>Exercise caution. Low reputation rating. Avoid large lockups.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReputationPanel;
