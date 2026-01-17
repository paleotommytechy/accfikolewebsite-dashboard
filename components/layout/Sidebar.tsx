
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink } = ReactRouterDOM;
import { useAppContext } from '../../context/AppContext';
import { NAV_LINKS, ADMIN_LINKS, BLOG_LINKS, MEDIA_LINKS, ACADEMICS_LINKS } from '../../constants';
import { UserIcon } from '../ui/Icons';

const Sidebar: React.FC = () => {
  const { isSidebarOpen, isAdmin, isBlogger, isMediaManager, isAcademicsManager, isPro, isFinance, isProfileComplete } = useAppContext();

  const linkClasses = "flex items-center py-3 px-4 rounded-xl transition-all duration-300 group font-bold text-sm tracking-tight";
  const activeLinkClasses = "bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-[1.02]";
  const hoverClasses = "hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400";
  const disabledClasses = "opacity-40 cursor-not-allowed pointer-events-none grayscale";

  return (
    <aside className={`fixed md:sticky top-0 left-0 h-full bg-white dark:bg-secondary border-r border-gray-100 dark:border-gray-800 transition-all duration-300 z-40 flex flex-col
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 
      ${isSidebarOpen ? 'w-64' : 'w-20'}
    `}>
      <div className="flex items-center px-5 h-16 border-b border-gray-50 dark:border-gray-800 flex-shrink-0">
        <img src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" alt="Logo" className="w-10 h-10 rounded-xl shadow-md flex-shrink-0" />
        {isSidebarOpen && <span className="ml-3 text-secondary dark:text-white text-lg font-black tracking-tighter uppercase">ACCF IKOLE</span>}
      </div>

      <nav className="flex flex-col p-3 space-y-1 flex-grow overflow-y-auto custom-scrollbar">
        <div className="pb-2 px-2">
            <p className={`text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>Menu</p>
            {NAV_LINKS.map((link) => {
            const isDisabled = !isProfileComplete && !['/dashboard', '/profile', '/blog', '/gallery', '/academics'].includes(link.href);
            return (
                <div key={link.name} title={isDisabled ? "Complete profile to access" : ""}>
                <NavLink
                    to={link.href}
                    className={({ isActive }) =>
                    `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isDisabled ? disabledClasses : ''}`
                    }
                    title={link.name}
                    end={link.href === '/dashboard'}
                >
                    <div className={`w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110`}>{link.icon}</div>
                    {isSidebarOpen && <span className="ml-4 truncate">{link.name}</span>}
                </NavLink>
                </div>
            );
            })}
        </div>
        
        {((isAdmin || isBlogger) && isSidebarOpen) && <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4 mb-3 px-2">Management</p>}
        
        {(isAdmin || isBlogger) && BLOG_LINKS.map((link) => (
            <NavLink key={link.name} to={link.href} className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses}`}>
                <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                {isSidebarOpen && <span className="ml-4 truncate">{link.name}</span>}
            </NavLink>
        ))}

        {(isAdmin || isPro || isFinance) && (
          <>
            {isSidebarOpen && <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4 mb-3 px-2">Core Admin</p>}
            {ADMIN_LINKS.filter(link => {
              if (link.href === '/event-management') return isAdmin || isPro;
              if (link.href === '/financial-management') return isAdmin || isFinance;
              return isAdmin;
            }).map((link) => (
                <NavLink key={link.name} to={link.href} className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses}`}>
                    <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                    {isSidebarOpen && <span className="ml-4 truncate">{link.name}</span>}
                </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-gray-50 dark:border-gray-800">
        <NavLink to="/developer-settings" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses}`}>
            <UserIcon className="w-6 h-6 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-4">App Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
