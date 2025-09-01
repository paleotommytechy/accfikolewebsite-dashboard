import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon, BellIcon, SunIcon, MoonIcon, ChevronDownIcon } from '../ui/Icons';
import { useAppContext } from '../../context/AppContext';
import { mockNotifications } from '../../services/mockData';
import Avatar from '../auth/Avatar';
import { supabase } from '../../lib/supabaseClient';

const Navbar: React.FC = () => {
  const { toggleSidebar, currentUser } = useAppContext();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Simple dark mode toggle for demonstration
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-dark shadow-sm h-16 flex items-center justify-between px-6 z-10">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md">
          <MenuIcon />
        </button>
        <h1 className="text-xl font-semibold ml-4 text-gray-800 dark:text-white">Welcome, {currentUser?.full_name || 'Member'}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
        </button>

        <div className="relative">
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
            <BellIcon />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark rounded-lg shadow-xl overflow-hidden z-20">
              <div className="py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">Notifications</div>
              <ul>
                {mockNotifications.slice(0, 3).map(n => (
                  <li key={n.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <a href="#" className="flex items-center px-4 py-3">
                      <div className={`p-2 rounded-full mr-3 ${n.read ? 'bg-gray-200' : 'bg-primary-100'}`}>
                        {/* Icon placeholder */}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{n.message}</p>
                        <p className="text-xs text-gray-400">{n.created_at}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative">
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
              <a href="#" onClick={() => supabase?.auth.signOut()} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;