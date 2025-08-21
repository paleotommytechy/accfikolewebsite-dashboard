
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  const { currentUser, isLoading } = useAppContext();

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

  return children;
};

export default ProtectedRoute;
