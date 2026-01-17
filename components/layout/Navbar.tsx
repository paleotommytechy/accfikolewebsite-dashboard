
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM;
import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, BellIcon } from '../ui/Icons';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import Avatar from '../auth/Avatar';
import { supabase } from '../../lib/supabaseClient';

const Navbar: React.FC = () => {
  const { toggleSidebar, currentUser, theme, toggleTheme } = useAppContext();
  const { notifications, unreadCount } = useNotifier();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <header className="bg-white dark:bg-dark shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors">
          <MenuIcon />
        </button>
        <h1 className="text-lg font-bold ml-2 text-gray-800 dark:text-white hidden xs:block">
          {currentUser?.full_name?.split(' ')[0] || 'Member'}
        </h1>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        <button onClick={toggleTheme} className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors">
          {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6" />}
        </button>

        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center relative transition-colors"
                aria-label="Notifications"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark"></span>
                )}
            </button>
            {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-[85vw] sm:w-80 bg-white dark:bg-dark rounded-2xl shadow-2xl z-20 border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in-up">
                    <div className="p-4 font-bold border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                        <span>Updates</span>
                        {unreadCount > 0 && <span className="text-[10px] font-black bg-primary-500 text-white rounded-full px-2 py-0.5 uppercase tracking-widest">{unreadCount} New</span>}
                    </div>
                    <ul className="max-h-[60vh] overflow-y-auto">
                        {notifications.slice(0, 5).map(notif => (
                            <li key={notif.id} className="border-b dark:border-gray-800/50 last:border-b-0">
                                <Link to={notif.link || '/notifications'} onClick={() => setIsNotifOpen(false)} className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    {!notif.is_read && <div className="w-2 h-2 mt-2 bg-primary-500 rounded-full flex-shrink-0"></div>}
                                    <p className={`text-sm leading-snug ${notif.is_read ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>{notif.message}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="block text-center py-3 text-xs font-bold text-primary-600 dark:text-primary-400 bg-gray-50/50 dark:bg-gray-800/30 uppercase tracking-widest hover:bg-primary-50 transition-colors">
                        View All
                    </Link>
                </div>
            )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center pl-2 hover:opacity-80 transition-opacity min-h-[44px]">
            <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'User'} size="md" className="border-2 border-white dark:border-gray-800 shadow-sm" />
            <ChevronDownIcon className="w-4 h-4 ml-1 text-gray-400" />
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-dark rounded-2xl shadow-2xl py-2 z-20 border border-gray-100 dark:border-gray-800 animate-fade-in-up">
              <Link to="/profile" className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">My Account</Link>
              <Link to="/developer-settings" className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">App Settings</Link>
              <hr className="my-2 border-gray-100 dark:border-gray-800" />
              <button onClick={() => supabase && (supabase.auth as any).signOut()} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
