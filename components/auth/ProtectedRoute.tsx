import React from 'react';
// FIX: Use named imports for react-router-dom to resolve module export errors.
import { useLocation, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }): React.ReactNode => {
  const { currentUser, isAdmin, isLoading, isProfileComplete } = useAppContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-light dark:bg-secondary">
        <p className="text-xl text-gray-800 dark:text-gray-200">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If profile is not complete, only allow access to dashboard and profile page
  const isAllowedPath = location.pathname === '/dashboard' || location.pathname === '/profile';
  if (!isProfileComplete && !isAllowedPath) {
    return <Navigate to="/profile" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
