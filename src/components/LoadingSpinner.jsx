import React from 'react';

/**
 * LoadingSpinner component - renders a premium, animated loading spinner.
 * @param {Object} props
 * @param {string} [props.size='md'] - size of the spinner ('sm', 'md', 'lg')
 * @param {string} [props.text] - optional description text to display below
 */
const LoadingSpinner = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing glow */}
        <div className={`absolute rounded-full bg-indigo-500/10 blur-xl ${
          size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24'
        }`} />
        
        {/* Spinner ring */}
        <div className={`rounded-full border-t-indigo-600 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin ${sizeClasses[size]}`} />
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
