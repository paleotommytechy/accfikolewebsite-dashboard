
import React, { useState } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { Outlet, useLocation } = ReactRouterDOM;
import Navbar from '../layout/Navbar';
import Sidebar from '../layout/Sidebar';
import { useAppContext } from '../../context/AppContext';
import { useNotifier } from '../../context/NotificationContext';
import Button from './Button';
import { XIcon } from './Icons';

const NotificationPermissionBanner: React.FC<{ onRequest: () => void }> = ({ onRequest }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary-500 text-white p-3 flex items-center justify-between gap-4 animate-fade-in-up">
      <p className="text-sm font-medium">Enable notifications to stay updated on new messages and tasks!</p>
      <div className="flex items-center gap-2">
        <Button onClick={onRequest} size="sm" className="bg-white/90 hover:bg-white text-secondary font-bold focus:ring-white">Enable</Button>
        <button onClick={() => setIsVisible(false)} className="p-1 rounded-full hover:bg-white/20">
            <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}


const DashboardLayout: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useAppContext();
  const { permissionStatus, requestNotificationPermission } = useNotifier();
  const location = useLocation();

  // Chat pages have their own header, so we hide the main navbar
  const isChatPage = location.pathname.startsWith('/messages');
  const showPermissionBanner = permissionStatus === 'default' && !isChatPage;


  return (
    <div className="flex h-screen bg-gray-100 dark:bg-secondary text-gray-800 dark:text-gray-200 overflow-hidden">
       {/* Overlay for mobile, shown when sidebar is open */}
       {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {!isChatPage && <Navbar />}
        {showPermissionBanner && (
          <NotificationPermissionBanner onRequest={requestNotificationPermission} />
        )}
        <main className={`flex-1 overflow-y-auto ${isChatPage ? '' : 'p-3 sm:p-6 lg:p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;