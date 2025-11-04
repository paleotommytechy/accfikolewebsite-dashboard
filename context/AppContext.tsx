import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from './NotificationContext';

type Theme = 'light' | 'dark';

interface AppContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  currentUser: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isBlogger: boolean;
  isMediaManager: boolean;
  isAcademicsManager: boolean;
  isPro: boolean;
  isFinance: boolean;
  isProfileComplete: boolean;
  theme: Theme;
  toggleTheme: () => void;
  refreshCurrentUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlogger, setIsBlogger] = useState(false);
  const [isMediaManager, setIsMediaManager] = useState(false);
  const [isAcademicsManager, setIsAcademicsManager] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
    }
    return 'light'; // Default to light theme
  });

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return newTheme;
    });
  }, []);
  
  // addToast is not available at module scope, so we need a lazy way to get it
  const GetNotifier = () => {
    try {
      return useNotifier();
    } catch {
      return { addToast: (msg: string, type: any) => console.log(`Toast (${type}): ${msg}`) };
    }
  }

  const fetchCurrentUser = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user }, error: sessionError } = await (supabase.auth as any).getUser();

      if (sessionError) throw sessionError;

      if (user) {
        const [roleResponse, profileResponse] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
          supabase.from('profiles').select('id, full_name, avatar_url, fellowship_position, level, department, gender, dob, whatsapp, hotline, email, coins, current_streak, longest_streak').eq('id', user.id).maybeSingle()
        ]);
        
        const { data: roleData, error: roleError } = roleResponse;
        if (roleError) console.error('Error checking user role:', roleError.message);
        
        const userRole = roleData?.role || 'member';
        
        const { data: profile, error: profileError } = profileResponse;
        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
        }
        
        if (profile) {
          // --- Normal flow for existing users ---
          setCurrentUser({ ...(profile as any), role: userRole });
          if (profile.full_name && profile.department && profile.whatsapp) {
            setIsProfileComplete(true);
          } else {
            setIsProfileComplete(false);
          }
        } else {
          // --- Onboarding flow for NEW users (profile doesn't exist) ---
          console.log("No profile found for this user. Attempting to create one on the client-side.");
          
          const newProfileData = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url,
          };

          const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfileData)
              .select()
              .single();

          if (createError) {
              console.error("CRITICAL: Failed to create profile on client-side:", createError.message);
              GetNotifier().addToast("A critical error occurred while setting up your account. Please try logging in again.", "error");
              await supabase.auth.signOut();
              return; // Exit
          }
          
          // Also create the user_role and onboarding_progress records. These are less critical.
          await supabase.from('user_roles').insert({ user_id: user.id, role: 'member' });
          await supabase.from('onboarding_progress').insert({ user_id: user.id });

          console.log("Client-side profile creation successful:", createdProfile);
          setCurrentUser({ ...(createdProfile as any), role: 'member' });
          setIsProfileComplete(false); // New profile is incomplete by default
        }

        const isAdminStatus = userRole === 'admin';
        const isBloggerStatus = userRole === 'blog';
        const isMediaManagerStatus = userRole === 'media';
        const isAcademicsManagerStatus = userRole === 'academics';
        const isProStatus = userRole === 'pro';
        const isFinanceStatus = userRole === 'finance';
        
        setIsAdmin(isAdminStatus);
        setIsBlogger(isBloggerStatus);
        setIsMediaManager(isMediaManagerStatus);
        setIsAcademicsManager(isAcademicsManagerStatus);
        setIsPro(isProStatus);
        setIsFinance(isFinanceStatus);

      } else {
        // No user session, clear all user-related state
        setCurrentUser(null);
        setIsAdmin(false);
        setIsBlogger(false);
        setIsMediaManager(false);
        setIsAcademicsManager(false);
        setIsPro(false);
        setIsFinance(false);
        setIsProfileComplete(false);
      }
    } catch (e) {
      const error = e as Error;
      if (error && error.message !== 'Auth session missing!') {
        console.error('An error occurred during user session fetch:', e);
      }
      setCurrentUser(null);
      setIsAdmin(false);
      setIsBlogger(false);
      setIsMediaManager(false);
      setIsAcademicsManager(false);
      setIsPro(false);
      setIsFinance(false);
      setIsProfileComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (!supabase) return;

    const isCallback = window.location.pathname.includes('auth/callback') || window.location.hash.includes('auth/callback');
    let timeoutId: number | undefined;

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(
      (_event: any, session: any) => {
        if (timeoutId) clearTimeout(timeoutId);
        fetchCurrentUser();
      }
    );

    if (isCallback) {
        timeoutId = window.setTimeout(() => {
            fetchCurrentUser(); 
        }, 3000);
    } else {
        fetchCurrentUser();
    }

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchCurrentUser]);


  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    isSidebarOpen,
    toggleSidebar,
    currentUser,
    isLoading,
    isAdmin,
    isBlogger,
    isMediaManager,
    isAcademicsManager,
    isPro,
    isFinance,
    isProfileComplete,
    theme,
    toggleTheme,
    refreshCurrentUser: fetchCurrentUser,
  }), [isSidebarOpen, toggleSidebar, currentUser, isLoading, isAdmin, isBlogger, isMediaManager, isAcademicsManager, isPro, isFinance, isProfileComplete, theme, toggleTheme, fetchCurrentUser]);

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