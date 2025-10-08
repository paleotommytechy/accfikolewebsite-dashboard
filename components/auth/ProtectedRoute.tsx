import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { useLocation, Navigate } = ReactRouterDOM;
import { useAppContext } from '../../context/AppContext';

// FIX: Made children prop optional to resolve TypeScript error in App.tsx.
// NEW: Added bloggerOnly, mediaOnly, proOnly, and academicsOnly props.
const ProtectedRoute = ({ children, adminOnly = false, bloggerOnly = false, mediaOnly = false, proOnly = false, academicsOnly = false, financeOnly = false }: { children?: React.ReactNode, adminOnly?: boolean, bloggerOnly?: boolean, mediaOnly?: boolean, proOnly?: boolean, academicsOnly?: boolean, financeOnly?: boolean }): React.ReactNode => {
  const { currentUser, isAdmin, isBlogger, isMediaManager, isAcademicsManager, isPro, isFinance, isLoading, isProfileComplete } = useAppContext();
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

  // If profile is not complete, only allow access to dashboard, profile, gallery and academics page
  const isAllowedPath = ['/dashboard', '/profile', '/gallery', '/academics'].includes(location.pathname);
  if (!isProfileComplete && !isAllowedPath) {
    return <Navigate to="/profile" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (bloggerOnly && !isAdmin && !isBlogger) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (mediaOnly && !isAdmin && !isMediaManager) {
    return <Navigate to="/dashboard" replace />;
  }

  if (proOnly && !isAdmin && !isPro) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (academicsOnly && !isAdmin && !isAcademicsManager) {
    return <Navigate to="/dashboard" replace />;
  }

  if (financeOnly && !isAdmin && !isFinance) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;