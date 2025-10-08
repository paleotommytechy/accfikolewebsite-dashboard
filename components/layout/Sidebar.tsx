import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink } = ReactRouterDOM;
import { useAppContext } from '../../context/AppContext';
import { NAV_LINKS, ADMIN_LINKS, BLOG_LINKS, MEDIA_LINKS, ACADEMICS_LINKS } from '../../constants';

const Sidebar: React.FC = () => {
  const { isSidebarOpen, isAdmin, isBlogger, isMediaManager, isAcademicsManager, isPro, isFinance, isProfileComplete } = useAppContext();

  const linkClasses = "flex items-center py-2.5 px-4 rounded transition duration-200";
  const activeLinkClasses = "bg-primary-700 text-white";
  const hoverClasses = "hover:bg-primary-700 hover:text-white";
  const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";

  return (
    <aside className={`fixed top-0 left-0 h-full bg-secondary text-gray-300 transition-all duration-300 z-40 flex flex-col w-64
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      lg:translate-x-0 
      ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
    `}>
      <div className="flex items-center justify-center h-16 border-b border-gray-700 flex-shrink-0">
        <img src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" alt="ACCF Ikole Logo" className="w-10 h-10 rounded-full border-2 border-gray-700 flex-shrink-0" />
        {isSidebarOpen && <span className="ml-3 text-white text-lg font-bold">ACCF Ikole</span>}
      </div>

      <nav className="flex flex-col p-4 space-y-2 flex-grow overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const isDisabled = !isProfileComplete && !['/dashboard', '/profile', '/blog', '/gallery', '/academics'].includes(link.href);
          return (
            <div key={link.name} title={isDisabled ? "Please complete your profile to access this page" : ""}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isDisabled ? disabledClasses : ''}`
                }
                title={link.name}
                end={link.href === '/dashboard'}
              >
                <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                {isSidebarOpen && <span className="ml-4">{link.name}</span>}
              </NavLink>
            </div>
          );
        })}
        
        {(isAdmin || isBlogger) && (
          <>
            <hr className="my-4 border-gray-700" />
            {BLOG_LINKS.map((link) => {
               const isDisabled = !isProfileComplete;
               return (
                <div key={link.name} title={isDisabled ? "Please complete your profile to access this page" : ""}>
                  <NavLink
                    to={link.href}
                    className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isDisabled ? disabledClasses : ''}`}
                    title={link.name}
                  >
                    <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                    {isSidebarOpen && <span className="ml-4">{link.name}</span>}
                  </NavLink>
                </div>
              );
            })}
          </>
        )}

        {(isAdmin || isMediaManager) && (
          <>
            <hr className="my-4 border-gray-700" />
            {MEDIA_LINKS.map((link) => {
               const isDisabled = !isProfileComplete;
               return (
                <div key={link.name} title={isDisabled ? "Please complete your profile to access this page" : ""}>
                  <NavLink
                    to={link.href}
                    className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isDisabled ? disabledClasses : ''}`}
                    title={link.name}
                  >
                    <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                    {isSidebarOpen && <span className="ml-4">{link.name}</span>}
                  </NavLink>
                </div>
              );
            })}
          </>
        )}
        
        {(isAdmin || isAcademicsManager) && (
          <>
            <hr className="my-4 border-gray-700" />
            {ACADEMICS_LINKS.map((link) => {
               const isDisabled = !isProfileComplete;
               return (
                <div key={link.name} title={isDisabled ? "Please complete your profile to access this page" : ""}>
                  <NavLink
                    to={link.href}
                    className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isDisabled ? disabledClasses : ''}`}
                    title={link.name}
                  >
                    <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                    {isSidebarOpen && <span className="ml-4">{link.name}</span>}
                  </NavLink>
                </div>
              );
            })}
          </>
        )}

        {(isAdmin || isPro || isFinance) && (
          <>
            <hr className="my-4 border-gray-700" />
            {ADMIN_LINKS.filter(link => {
              if (link.href === '/event-management') return isAdmin || isPro;
              if (link.href === '/financial-management') return isAdmin || isFinance;
              return isAdmin;
            }).map((link) => {
              const isDisabled = !isProfileComplete;
              return (
                <div key={link.name} title={isDisabled ? "Please complete your profile to access this page" : ""}>
                  <NavLink
                    to={link.href}
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isDisabled ? disabledClasses : ''}`
                    }
                    title={link.name}
                  >
                    <div className="w-6 h-6 flex-shrink-0">{link.icon}</div>
                    {isSidebarOpen && <span className="ml-4">{link.name}</span>}
                  </NavLink>
                </div>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;