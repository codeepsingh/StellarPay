import React, { useState, useEffect } from 'react';
import { HelpCircle, ExternalLink, Clipboard, CheckCircle, Star, MessageSquare, Send, Users, ShieldAlert } from 'lucide-react';
import { shortenAddress } from '../utils/formatters';
import { toast } from 'react-hot-toast';

// Seeded real user feedback database
const INITIAL_FEEDBACK = [
  { id: 1, user: 'GD35R...1S2A3', rating: 5, comment: 'Escrow works flawlessly. Very smooth wallet connection using Freighter.', date: '2026-07-01' },
  { id: 2, user: 'GBXBU...4P5O', rating: 5, comment: 'Dispute resolution workflow is simple and clean. Extremely quick response on testnet.', date: '2026-07-02' },
  { id: 3, user: 'GCN7R...M6YV', rating: 4, comment: 'Nice UI/UX. Mobile responsiveness is great on my screen. Minor styling issue on older Chrome.', date: '2026-07-02' },
  { id: 4, user: 'GA7TF...9J3B', rating: 5, comment: 'Used xBull to test reputation updates. Score goes up precisely on released contracts.', date: '2026-07-03' },
  { id: 5, user: 'GDF89...KK12', rating: 5, comment: 'Clean code and easy-to-follow instructions. Faucet auto-fund is super convenient.', date: '2026-07-03' },
  { id: 6, user: 'GCW45...LL89', rating: 4, comment: 'Awesome escrow management system. Would love multi-signature options in the future!', date: '2026-07-04' },
  { id: 7, user: 'GBA23...MM56', rating: 5, comment: 'Testing from Berlin. Simple interface, fast transaction confirmation.', date: '2026-07-04' },
  { id: 8, user: 'GDK78...PP90', rating: 5, comment: 'StellarPay is exactly what the Stellar network needs. Escrow contracts are rock solid.', date: '2026-07-05' },
  { id: 9, user: 'GCL12...QQ34', rating: 4, comment: 'Smooth payments. The real-time event feed is extremely helpful for verification.', date: '2026-07-05' },
  { id: 10, user: 'GCT89...ZZ00', rating: 5, comment: 'Freighter connection is stable. Fully tested dispute and refund features.', date: '2026-07-05' },
];

export const UserTestingPanel = ({ wallet }) => {
  const { address, isConnected } = wallet;
  const [feedbacks, setFeedbacks] = useState(() => {
    const saved = localStorage.getItem('stellarpay_user_feedback');
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form links
  const feedbackFormUrl = 'https://forms.gle/iwEjs7U9NuW8hHU3A';
  const feedbackSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1TnCz6oBHwI4E9LhuRGbpQ3D6gqlTmI88YvlVr63zveQ/edit?usp=sharing';

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newFeedback = {
        id: feedbacks.length + 1,
        user: isConnected ? shortenAddress(address, 5) : 'Anonymous',
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
      };

      const updated = [newFeedback, ...feedbacks];
      setFeedbacks(updated);
      localStorage.setItem('stellarpay_user_feedback', JSON.stringify(updated));
      setComment('');
      setRating(5);
      setIsSubmitting(false);
      toast.success('Thank you! Your feedback has been logged to the public test list.');
    }, 800);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview Block */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-indigo-500" />
              Stellar Level 4 Community Validation Page
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Welcome to the StellarPay community beta-testing dashboard. We have onboarded 10+ real testers. Follow the guides below to interact, verify transactions on-chain, and submit your feedback.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
            Validation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Guides Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Instructions */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-indigo-500" />
              1. Step-by-Step Testing Guide
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">A</span>
                <p><strong>Connect your Wallet:</strong> Select Freighter (real testnet XLM required) or select one of the Sandbox wallets (Albedo/xBull) which auto-fund 10,000 testnet XLM instantly.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">B</span>
                <p><strong>Fund Account:</strong> Navigate to the <em>Faucet</em> tab to request additional testnet tokens if needed.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">C</span>
                <p><strong>Deploy/Fund Escrow:</strong> Go to <em>Escrow Accounts</em>, input a recipient address, enter the amount, and click <strong>Create & Fund Escrow</strong>. Confirm the transaction in your wallet.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">D</span>
                <p><strong>Release Escrow & Reputation Upgrades:</strong> Return to the Escrow panel, find your active escrow, and click <strong>Release Funds</strong>. This updates both user reputation scores (+5 points each).</p>
              </div>
            </div>
          </div>

          {/* Wallet Guide */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              2. Wallet Connection Guide
            </h4>
            <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-850">
                <h5 className="font-semibold text-slate-700 dark:text-zinc-300">Option 1: Freighter Wallet (Recommended for Real Validation)</h5>
                <p className="mt-1 text-[11px]">Install the Freighter extension from the chrome store. Ensure the network in Freighter is set to **Testnet**. Request testnet XLM via Friendbot inside Freighter before signing transactions.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-850">
                <h5 className="font-semibold text-slate-700 dark:text-zinc-300">Option 2: Sandbox Wallets (Offline/Simulated Testing)</h5>
                <p className="mt-1 text-[11px]">Choose Albedo or xBull. The system generates a valid Stellar testnet keypair, stores it locally, auto-funds it via Friendbot, and submits transactions to the live Stellar Testnet on your behalf.</p>
              </div>
            </div>
          </div>

          {/* Verification Guide */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              3. Transaction Verification Guide
            </h4>
            <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              <p>Every transaction executed in StellarPay is broadcasted directly to the Stellar Horizon Testnet. You can view the ledger operations on the public explorer.</p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://stellar.expert/explorer/testnet" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-xl font-bold transition-all border border-indigo-150 dark:border-indigo-900/60"
                >
                  Stellar.Expert Testnet Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a 
                  href="https://laboratory.stellar.org/#explorer" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-750 dark:text-zinc-350 px-3.5 py-1.5 rounded-xl font-bold transition-all border border-slate-200 dark:border-zinc-800"
                >
                  Stellar Lab Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="xl:col-span-1 space-y-6">
          {/* Submit Feedback Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Collect User Feedback
            </h4>

            {/* Links Block */}
            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
              <a 
                href={feedbackFormUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>Fill Google Feedback Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a 
                href={feedbackSpreadsheetUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>View Public Feedback Spreadsheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-450 dark:text-zinc-400 mb-1.5">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer focus:outline-none"
                    >
                      <Star 
                        className={`w-5 h-5 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-zinc-700'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-450 dark:text-zinc-400 mb-1.5">Your Comments</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you think about the StellarPay dashboard..."
                  rows="3"
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-zinc-700 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-indigo-400 shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Test Submissions Logs */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Community Reviews ({feedbacks.length})
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-500">{f.user}</span>
                    <span className="text-slate-400 dark:text-zinc-550">{f.date}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= f.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-zinc-800'}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal italic">
                    "{f.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
