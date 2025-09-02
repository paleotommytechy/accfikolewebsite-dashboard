
import React from 'react';
// FIX: Changed to namespace import to fix module resolution issues with react-router-dom.
import * as ReactRouterDOM from 'react-router-dom';
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
    return <ReactRouterDOM.Navigate to="/auth" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <ReactRouterDOM.Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;