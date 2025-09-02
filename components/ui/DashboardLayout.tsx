
import React from 'react';
// FIX: Changed to namespace import to fix module resolution issues with react-router-dom.
import * as ReactRouterDOM from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Sidebar from '../layout/Sidebar';
import { useAppContext } from '../../context/AppContext';

const DashboardLayout: React.FC = () => {
  const { isSidebarOpen } = useAppContext();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-secondary text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ReactRouterDOM.Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;