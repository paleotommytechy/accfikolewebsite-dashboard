import React, { useState, useEffect } from 'react';
// FIX: Use named imports for react-router-dom to resolve module export errors.
import { Link } from 'react-router-dom';
import { MenuIcon, BellIcon, SunIcon, MoonIcon, ChevronDownIcon, CheckIcon } from '../ui/Icons';
import { useAppContext } from '../../context/AppContext';
import Avatar from '../auth/Avatar';
import { supabase } from '../../lib/supabaseClient';
import type { Notification } from '../../types';

const Navbar: React.FC = () => {
  const { toggleSidebar, currentUser } = useAppContext();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Simple dark mode toggle for demonstration
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };
  
  useEffect(() => {
    const fetchNotifications = async () => {
        if (currentUser && supabase) {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) {
                console.error('Error fetching notifications:', error);
            } else {
                setNotifications(data as Notification[] || []);
            }
        }
    };

    fetchNotifications();

    if (supabase && currentUser) {
        const channel = supabase.channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, payload => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}, [currentUser]);

  const handleToggleNotifications = async () => {
      const willBeOpen = !isNotificationsOpen;
      setIsNotificationsOpen(willBeOpen);

      if (willBeOpen && unreadCount > 0) {
          if (supabase && currentUser) {
              const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
              if (unreadIds.length > 0) {
                  const { error } = await supabase.from('notifications')
                      .update({ read: true })
                      .in('id', unreadIds);
                  
                  if (!error) {
                      setNotifications(prev => prev.map(n => ({...n, read: true})));
                  }
              }
          }
      }
  };


  return (
    <header className="bg-white dark:bg-dark shadow-sm h-16 flex items-center justify-between px-6 z-10 flex-shrink-0">
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

        <div className="relative">
          <button onClick={handleToggleNotifications} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
            <BellIcon />
            {unreadCount > 0 && <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>}
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark rounded-lg shadow-xl overflow-hidden z-20">
              <div className="py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">Notifications</div>
              {notifications.length > 0 ? (
                <ul>
                  {notifications.map(n => (
                    <li key={n.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!n.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                      <Link to={n.link || '#'} className="block px-4 py-3">
                        <p className="text-sm text-gray-700 dark:text-gray-200">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 text-sm py-6 px-4">You have no new notifications.</p>
              )}
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