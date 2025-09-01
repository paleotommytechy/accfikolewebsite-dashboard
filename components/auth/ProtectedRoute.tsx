
import React from 'react';
// FIX: Replaced Redirect with Navigate for react-router-dom v6 compatibility.
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }): React.ReactNode => {
  const { currentUser, isAdmin, isLoading } = useAppContext();

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
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
