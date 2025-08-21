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
  refreshCurrentUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    
    // Set loading to true only if not already loading to avoid flickers on refetch
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, fellowship_position, level, department, gender, dob, whatsapp, hotline, email, coins, role')
          .eq('id', session.user.id)
          .maybeSingle(); 

        if (error) {
          console.error('Error fetching profile:', error.message);
          setCurrentUser(null);
        } else if (profile) {
          setCurrentUser({ ...(profile as any), badges: mockBadges });
        } else if (session.user) {
          const temporaryProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: null,
              avatar_url: null,
              fellowship_position: null,
              level: 1,
              department: null,
              gender: null,
              dob: null,
              whatsapp: null,
              hotline: null,
              coins: 0,
              badges: [],
              role: 'member',
          };
          setCurrentUser(temporaryProfile);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          fetchCurrentUser();
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const value = useMemo(() => ({
    isSidebarOpen,
    toggleSidebar,
    currentUser,
    isLoading,
    isAdmin: currentUser?.role === 'admin',
    refreshCurrentUser: fetchCurrentUser,
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
