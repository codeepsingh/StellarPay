import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * SuccessBanner component - renders a clear, user-friendly success message block.
 * @param {Object} props
 * @param {string} props.message - The success details
 * @param {string} [props.title='Success'] - The success block title
 */
const SuccessBanner = ({ message, title = 'Success' }) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all duration-300">
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
      <div className="text-left">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs opacity-90">{message}</p>
      </div>
    </div>
  );
};

export default SuccessBanner;
