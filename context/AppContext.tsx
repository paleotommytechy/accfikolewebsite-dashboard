
import React, { createContext, useState, useContext, useMemo } from 'react';
import type { UserProfile } from '../types';
import { mockUserProfile } from '../services/mockData';

interface AppContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  currentUser: UserProfile | null;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, this would be a useEffect fetching from Supabase
  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(res => setTimeout(res, 500));
      setCurrentUser(mockUserProfile);
      setIsLoading(false);
    };
    fetchUser();
  }, []);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const value = useMemo(() => ({
    isSidebarOpen,
    toggleSidebar,
    currentUser,
    isLoading
  }), [isSidebarOpen, currentUser, isLoading]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
