
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAppContext } from '../../context/AppContext';
// FIX: Replaced children with Outlet for react-router-dom v6 compatibility
import { Outlet } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  const { isSidebarOpen } = useAppContext();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-secondary text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* FIX: Replaced children prop with Outlet for react-router-dom v6 compatibility */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
