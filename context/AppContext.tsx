
import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { mockBadges } from '../services/mockData'; // Keeping mock badges for now for simplicity

interface AppContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  currentUser: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, fellowship_position, level, department, gender, dob, whatsapp, hotline, email, coins, role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error.message);
          } else if (profile) {
            // The profile from Supabase doesn't include 'badges'.
            // Add mocked badges to form a valid UserProfile.
            setCurrentUser({ ...profile, badges: mockBadges } as UserProfile);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // For simplicity, we only refetch on auth change.
        // A more robust solution might handle specific events like SIGNED_IN, SIGNED_OUT.
        fetchSession();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const value = useMemo(() => ({
    isSidebarOpen,
    toggleSidebar,
    currentUser,
    isLoading,
    isAdmin: currentUser?.role === 'admin'
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
