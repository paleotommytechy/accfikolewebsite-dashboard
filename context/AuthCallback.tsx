
import React, { useEffect } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import { useAppContext } from './AppContext';

const AuthCallback: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // If the URL has an access_token, Supabase is processing it.
    // We should wait until isLoading is false before making any decisions.
    if (window.location.hash.includes('access_token')) {
      if (!isLoading) {
        // By now, currentUser should be set if login was successful
        if (currentUser) {
          navigate('/dashboard', { replace: true });
        } else {
          // If still no user, something went wrong with the session validation.
          navigate('/auth', { state: { error: 'Authentication failed. Please try again.' }, replace: true });
        }
      }
      // If isLoading is true, we just wait for the next render for AppContext to update.
    } else if (!isLoading) {
      // If there's no token in the hash and we're not loading,
      // the user shouldn't be on this page. Go back to auth.
      navigate('/auth', { replace: true });
    }
  }, [currentUser, isLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-light dark:bg-secondary">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Authenticating...</h1>
        <p className="text-gray-600 dark:text-gray-400">Please wait while we securely log you in.</p>
        {/* Simple spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mt-4"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
