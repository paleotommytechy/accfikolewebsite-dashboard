
import React, { useEffect } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import { useAppContext } from './AppContext';

const AuthCallback: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // The AppContext's onAuthStateChange listener is the primary mechanism
    // for handling the session. It will parse the token from the URL hash.
    // This component's effect is a fallback/helper to ensure the user is
    // navigated away once the state is resolved.
    if (!isLoading) {
      if (currentUser) {
        navigate('/dashboard', { replace: true });
      } else {
        // If after loading, there's still no user, something might be wrong.
        // We can wait a bit and then redirect to login.
        const timeoutId = setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 2000); // 2-second delay before redirecting to login on failure.
        return () => clearTimeout(timeoutId);
      }
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