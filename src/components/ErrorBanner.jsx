import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * ErrorBanner component - renders a clear, user-friendly error message block.
 * @param {Object} props
 * @param {string} props.message - The error details
 * @param {Function} [props.onRetry] - Optional click handler to retry the action
 */
const ErrorBanner = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-red-200/50 dark:border-red-900/30 bg-red-500/5 dark:bg-red-500/10 text-red-600 dark:text-red-400 gap-4 transition-all duration-300">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
        <div className="text-left">
          <h4 className="font-semibold text-sm">Operation Failed</h4>
          <p className="text-xs opacity-90">{message || 'An unexpected error occurred. Please try again.'}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-sm hover:shadow active:scale-95 transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
