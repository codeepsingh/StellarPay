import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, Info, Landmark, Edit3 } from 'lucide-react';
import { isValidStellarAddress, validateAmount, validateMemo } from '../utils/validators';
import { sendPayment } from '../services/stellarService';
import { toast } from 'react-hot-toast';

/**
 * SendPaymentForm component - handles the input validation and transaction initiation.
 * @param {Object} props
 * @param {Object} props.wallet - The custom wallet state object
 * @param {Function} props.onTransactionStart - Callback when signing/sending starts
 * @param {Function} props.onTransactionResult - Callback to deliver transaction receipt or failure details
 */
const SendPaymentForm = ({ wallet, onTransactionStart, onTransactionResult }) => {
  const { address: senderAddress, balance, isConnected, isFunded, refreshBalance, addTransaction } = wallet;

  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when connection status changes
  useEffect(() => {
    setErrors({});
  }, [isConnected]);

  // Handle live validations
  const validateForm = () => {
    const newErrors = {};

    if (!isConnected) {
      newErrors.wallet = 'Please connect your wallet first.';
    } else if (!isFunded) {
      newErrors.wallet = 'Your account is not active. Please fund it first.';
    }

    if (!recipient.trim()) {
      newErrors.recipient = 'Recipient address is required.';
    } else if (!isValidStellarAddress(recipient.trim())) {
      newErrors.recipient = 'Invalid Stellar public address (should start with G and be 56 characters).';
    } else if (recipient.trim() === senderAddress) {
      newErrors.recipient = 'Cannot send payment to your own address.';
    }

    const amountError = validateAmount(amount, parseFloat(balance));
    if (amountError) {
      newErrors.amount = amountError;
    }

    const memoError = validateMemo(memo);
    if (memoError) {
      newErrors.memo = memoError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsSubmitting(false); // Clear before starting
    
    const loadingToast = toast.loading('Initiating payment transaction...');
    onTransactionStart(); // Notify parent that loader is running
    setIsSubmitting(true);

    try {
      // Execute transaction submission
      const receipt = await sendPayment(
        senderAddress,
        recipient.trim(),
        amount,
        memo.trim()
      );
      
      toast.dismiss(loadingToast);
      toast.success('Transaction submitted successfully!');
      
      // Save to local activity history
      addTransaction({
        hash: receipt.hash,
        amount: amount,
        recipient: recipient.trim(),
        memo: memo.trim(),
        status: 'Success',
        timestamp: receipt.timestamp,
        ledger: receipt.ledger,
      });

      // Clear form
      setRecipient('');
      setAmount('');
      setMemo('');
      
      // Auto-refresh wallet balance
      setTimeout(() => {
        refreshBalance();
      }, 2000);

      // Callback with success receipt
      onTransactionResult({
        success: true,
        data: {
          hash: receipt.hash,
          amount: amount,
          recipient: recipient.trim(),
          memo: memo.trim(),
          timestamp: receipt.timestamp,
          ledger: receipt.ledger,
        }
      });
      
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Payment failed.');

      // Save failed tx to local history too for tracking!
      addTransaction({
        hash: err.message?.includes('signing rejected') ? '' : `failed_${Date.now()}`,
        amount: amount,
        recipient: recipient.trim(),
        memo: memo.trim(),
        status: 'Failed',
        error: err.message,
        timestamp: new Date().toISOString(),
      });

      // Callback with failure info
      onTransactionResult({
        success: false,
        error: err.message || 'Transaction could not be completed.'
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md transition-all duration-300">
      <div className="space-y-6">
        
        {/* Title */}
        <div className="flex items-center gap-2 text-left">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Send Payment</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Transfer native XLM instantly to any Stellar account on the Testnet.
            </p>
          </div>
        </div>

        {/* Not Connected Block */}
        {!isConnected && (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-slate-400 dark:text-zinc-500 bg-slate-50/50 dark:bg-zinc-900/10">
            <p className="text-sm font-semibold">Please connect your wallet to make payments</p>
          </div>
        )}

        {/* Active Form */}
        {isConnected && (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {errors.wallet && (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.wallet}</span>
              </div>
            )}

            {/* Recipient Input */}
            <div className="space-y-1">
              <label htmlFor="recipient" className="text-xs font-bold text-slate-500 dark:text-zinc-400 block">
                Recipient Stellar Address (G...)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Landmark className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="recipient"
                  disabled={isSubmitting}
                  placeholder="GBCDEF...XYZ"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    errors.recipient 
                      ? 'border-rose-500/50 focus:ring-rose-500' 
                      : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
              </div>
              {errors.recipient && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {errors.recipient}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label htmlFor="amount" className="text-xs font-bold text-slate-500 dark:text-zinc-400 block">
                Amount (XLM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  id="amount"
                  disabled={isSubmitting}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full py-2.5 px-4 text-sm rounded-xl border bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    errors.amount 
                      ? 'border-rose-500/50 focus:ring-rose-500' 
                      : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400 dark:text-zinc-500 pointer-events-none">
                  XLM
                </span>
              </div>
              {errors.amount && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {errors.amount}
                </p>
              )}
            </div>

            {/* Memo Input */}
            <div className="space-y-1">
              <label htmlFor="memo" className="text-xs font-bold text-slate-500 dark:text-zinc-400 block">
                Memo <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-600">(Optional - Max 28 characters)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Edit3 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="memo"
                  disabled={isSubmitting}
                  placeholder="Reference memo text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className={`w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    errors.memo 
                      ? 'border-rose-500/50 focus:ring-rose-500' 
                      : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
              </div>
              {errors.memo && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {errors.memo}
                </p>
              )}
            </div>

            {/* Fee Note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-900/50 text-[11px] text-slate-500 dark:text-zinc-400">
              <Info className="w-3.5 h-3.5 mt-0.5 text-indigo-500 flex-shrink-0" />
              <div className="leading-relaxed">
                Stellar network fees are extremely low. This transaction uses a standard network fee of <strong>0.00001 XLM</strong> (100 stroops).
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Payment
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default SendPaymentForm;
