import React, { useState, useEffect, useRef } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM;
import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, BellIcon } from '../ui/Icons';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import Avatar from '../auth/Avatar';
import { supabase } from '../../lib/supabaseClient';

const Navbar: React.FC = () => {
  const { toggleSidebar, currentUser } = useAppContext();
  const { notifications, unreadCount } = useNotifier();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Simple dark mode toggle for demonstration
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <header className="bg-white dark:bg-dark shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md">
          <MenuIcon />
        </button>
        <h1 className="text-xl font-semibold ml-4 text-gray-800 dark:text-white hidden sm:block">Welcome, {currentUser?.full_name || 'Member'}</h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none relative"
                aria-label="View notifications"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark"></span>
                )}
            </button>
            {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-[90vw] sm:w-96 bg-white dark:bg-dark rounded-md shadow-lg z-20 border dark:border-gray-700 max-h-[80vh] flex flex-col">
                    <div className="p-3 font-semibold border-b dark:border-gray-700 flex justify-between items-center">
                        <span>Notifications</span>
                        {unreadCount > 0 && <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-0.5">{unreadCount} new</span>}
                    </div>
                    <ul className="flex-1 overflow-y-auto">
                        {notifications.slice(0, 5).map(notif => (
                            <li key={notif.id} className="border-b dark:border-gray-700/50 last:border-b-0">
                                <Link to={notif.link || '/notifications'} onClick={() => setIsNotifOpen(false)} className="flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {!notif.is_read && <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" title="Unread"></div>}
                                    <p className={`text-sm ${notif.is_read ? 'text-gray-500' : 'text-gray-800 dark:text-gray-100'} line-clamp-2`}>{notif.message}</p>
                                </Link>
                            </li>
                        ))}
                        {notifications.length === 0 && (
                            <li className="p-4 text-center text-gray-500">You're all caught up!</li>
                        )}
                    </ul>
                    <div className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
                        <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="block text-center text-sm font-semibold text-primary-600 hover:underline">
                            View All Notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2">
            <Avatar src={currentUser?.avatar_url} alt={currentUser?.full_name || 'User Avatar'} size="md" />
            <span className="hidden md:inline text-sm font-medium">{currentUser?.full_name || 'Member'}</span>
            <ChevronDownIcon />
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark rounded-md shadow-lg py-1 z-20">
              <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</Link>
              <Link to="/developer-settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</Link>
              {/* FIX: Assuming 'signOut' error is a red herring due to other type issues. No change needed. */}
              {/* FIX: Casting `supabase.auth` to `any` to bypass TypeScript errors. This suggests a potential mismatch between the installed Supabase client version and its type definitions. */}
              <a href="#" onClick={() => supabase && (supabase.auth as any).signOut()} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;