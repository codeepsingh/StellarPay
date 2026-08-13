import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, CheckSquare } from 'lucide-react';
import { apiService } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell = ({ address }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!address) return;
    
    // Initial fetch
    fetchNotifications();

    // Poll every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [address]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiService.getNotifications(address);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to poll notifications:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await apiService.markNotificationsRead(address);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-xl backdrop-blur-md z-50 flex flex-col max-h-[400px]"
          >
            {/* Popover Header */}
            <div className="flex justify-between items-center p-3.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
              <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">
                In-App Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                  <p>No notifications yet</p>
                  <p className="text-[10px] opacity-75">Activities will trigger alerts here.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-3.5 flex gap-2.5 transition-colors ${
                      !notif.read ? 'bg-indigo-500/5 font-medium' : ''
                    }`}
                  >
                    {getIcon(notif.type)}
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 dark:text-zinc-200">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-zinc-500 pt-0.5">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
