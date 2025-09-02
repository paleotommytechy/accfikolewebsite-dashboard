
import React from 'react';
// FIX: Changed to namespace import to fix module resolution issues with react-router-dom.
import * as ReactRouterDOM from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { NAV_LINKS, ADMIN_LINKS } from '../../constants';

const Sidebar: React.FC = () => {
  const { isSidebarOpen, isAdmin } = useAppContext();

  const linkClasses = "flex items-center py-2.5 px-4 rounded transition duration-200 hover:bg-primary-700 hover:text-white";
  const activeLinkClasses = "bg-primary-700 text-white";

  return (
    <aside className={`fixed top-0 left-0 h-full bg-secondary text-gray-300 transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <img src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" alt="ACCF Ikole Logo" className="w-10 h-10 rounded-full border-2 border-gray-700" />
        {isSidebarOpen && <span className="ml-3 text-white text-lg font-bold">ACCF Ikole</span>}
      </div>

      <nav className="flex flex-col p-4 space-y-2 flex-grow">
        {NAV_LINKS.map((link) => (
          // FIX: Updated NavLink to use v6 props: className function and `end` prop.
          <ReactRouterDOM.NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) =>
              isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses
            }
            title={link.name}
            end={link.href === '/dashboard'}
          >
            <div className="w-6 h-6">{link.icon}</div>
            {isSidebarOpen && <span className="ml-4">{link.name}</span>}
          </ReactRouterDOM.NavLink>
        ))}
        
        {isAdmin && (
          <>
            <hr className="my-4 border-gray-700" />
            {ADMIN_LINKS.map((link) => (
              // FIX: Updated NavLink to use v6 props: className function.
              <ReactRouterDOM.NavLink
                key={link.name}
                to={link.href}
                className={({ isActive }) =>
                  isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses
                }
                title={link.name}
              >
                <div className="w-6 h-6">{link.icon}</div>
                {isSidebarOpen && <span className="ml-4">{link.name}</span>}
              </ReactRouterDOM.NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;