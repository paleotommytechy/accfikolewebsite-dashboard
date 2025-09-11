
import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { Outlet, useLocation } = ReactRouterDOM;
import Navbar from '../layout/Navbar';
import Sidebar from '../layout/Sidebar';
import { useAppContext } from '../../context/AppContext';

const DashboardLayout: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useAppContext();
  const location = useLocation();

  // Chat pages have their own header, so we hide the main navbar
  const isChatPage = location.pathname.startsWith('/messages');

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
        <main className={`flex-1 overflow-y-auto ${isChatPage ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;