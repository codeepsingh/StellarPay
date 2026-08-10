import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeToggle component - custom switch to change between light and dark mode.
 * @param {Object} props
 * @param {string} props.theme - 'light' or 'dark'
 * @param {Function} props.toggleTheme - Toggle handler
 */
const ThemeToggle = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden active:scale-95 cursor-pointer"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="dark-icon"
            initial={{ y: 30, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -30, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
          </motion.div>
        ) : (
          <motion.div
            key="light-icon"
            initial={{ y: 30, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -30, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Sun className="w-5 h-5 text-amber-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
