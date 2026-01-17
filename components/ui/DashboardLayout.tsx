
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Outlet, useLocation, NavLink } = ReactRouterDOM;
import Navbar from '../layout/Navbar';
import Sidebar from '../layout/Sidebar';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import Button from './Button';
import { XIcon, HomeIcon, ClipboardListIcon, ChatIcon, UserIcon, WifiIcon } from './Icons';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 text-center animate-pulse flex items-center justify-center gap-2">
      <WifiIcon className="w-3 h-3" /> Offline Mode — Using Grace Cache
    </div>
  );
};

const NotificationPermissionBanner: React.FC<{ onRequest: () => void }> = ({ onRequest }) => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  return (
    <div className="bg-primary-500 text-white p-3 flex items-center justify-between gap-4 animate-fade-in-up">
      <p className="text-sm font-medium text-center flex-1">Enable push notifications for updates!</p>
      <div className="flex items-center gap-2">
        <Button onClick={onRequest} size="sm" className="bg-white/90 hover:bg-white text-secondary font-bold">Enable</Button>
        <button onClick={() => setIsVisible(false)} className="p-1 rounded-full hover:bg-white/20">
            <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

const BottomNav: React.FC = () => {
    const navItems = [
        { icon: <HomeIcon className="w-6 h-6" />, label: 'Home', href: '/dashboard' },
        { icon: <ClipboardListIcon className="w-6 h-6" />, label: 'Tasks', href: '/tasks' },
        { icon: <ChatIcon className="w-6 h-6" />, label: 'Chats', href: '/messages' },
        { icon: <UserIcon className="w-6 h-6" />, label: 'Profile', href: '/profile' },
    ];
    return (
        <nav className="md:hidden glass border-t border-gray-200/50 dark:border-gray-800/50 px-4 pt-2 flex justify-around items-center z-40 pb-[calc(env(safe-area-inset-bottom)+8px)]">
            {navItems.map((item) => (
                <NavLink key={item.label} to={item.href} className={({ isActive }) => `flex flex-col items-center gap-1 group transition-all duration-300 relative px-4 py-1`}>
                    {({ isActive }) => (
                        <>
                            <div className={`absolute inset-0 mx-auto w-12 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-primary-100 dark:bg-primary-900/30 scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
                            <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {item.icon}
                            </div>
                            <span className={`relative z-10 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                {item.label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};

const DashboardLayout: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useAppContext();
  const { permissionStatus, requestNotificationPermission } = useNotifier();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/messages');
  const showPermissionBanner = permissionStatus === 'default' && !isChatPage;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-secondary text-gray-800 dark:text-gray-200 overflow-hidden">
      <OfflineIndicator />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {isSidebarOpen && (
          <div onClick={toggleSidebar} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" aria-hidden="true" />
        )}
        <Sidebar />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} overflow-hidden`}>
          {!isChatPage && <Navbar />}
          {showPermissionBanner && <NotificationPermissionBanner onRequest={requestNotificationPermission} />}
          <main className={`flex-1 min-h-0 ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto p-4 sm:p-6 lg:p-10'}`}>
            <div className={isChatPage ? "h-full" : "max-w-7xl mx-auto"}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;
