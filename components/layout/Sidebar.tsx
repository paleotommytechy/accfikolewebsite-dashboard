import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { NAV_LINKS, ADMIN_LINKS } from '../../constants';
import { LogoIcon } from '../ui/Icons';

const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useAppContext();

  const linkClasses = "flex items-center py-2.5 px-4 rounded transition duration-200 hover:bg-primary-700 hover:text-white";
  const activeLinkClasses = "bg-primary-700 text-white";

  return (
    <aside className={`fixed top-0 left-0 h-full bg-secondary text-gray-300 transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <LogoIcon className="w-8 h-8 text-primary-400" />
        {isSidebarOpen && <span className="ml-3 text-white text-lg font-bold">ACCF Ikole</span>}
      </div>

      <nav className="flex flex-col p-4 space-y-2 flex-grow">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            title={link.name}
          >
            <div className="w-6 h-6">{link.icon}</div>
            {isSidebarOpen && <span className="ml-4">{link.name}</span>}
          </NavLink>
        ))}
        
        <hr className="my-4 border-gray-700" />

        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            title={link.name}
          >
            <div className="w-6 h-6">{link.icon}</div>
            {isSidebarOpen && <span className="ml-4">{link.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;