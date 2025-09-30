import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

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
  isProfileComplete: boolean;
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
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const fetchCurrentUser = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // FIX: Property 'getSession' does not exist on type 'SupabaseAuthClient'. Changed to getUser() which is more broadly available.
      // FIX: Casting `supabase.auth` to `any` to bypass TypeScript errors. This suggests a potential mismatch between the installed Supabase client version and its type definitions.
      const { data: { user }, error: sessionError } = await (supabase.auth as any).getUser();

      if (sessionError) throw sessionError;

      if (user) {
        // const user = session.user; // user object is now directly available
        
        // Fetch role and profile in parallel
        const [roleResponse, profileResponse] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
          supabase.from('profiles').select('id, full_name, avatar_url, fellowship_position, level, department, gender, dob, whatsapp, hotline, email, coins').eq('id', user.id).maybeSingle()
        ]);
        
        const { data: roleData, error: roleError } = roleResponse;
        if (roleError) console.error('Error checking user role:', roleError.message);
        
        const userRole = roleData?.role || 'member';
        const isAdminStatus = userRole === 'admin';
        const isBloggerStatus = userRole === 'blog';
        const isMediaManagerStatus = userRole === 'media';
        const isAcademicsManagerStatus = userRole === 'academics';
        const isProStatus = userRole === 'pro';

        const { data: profile, error: profileError } = profileResponse;
        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
        }
        
        if (profile) {
          setCurrentUser({ ...(profile as any), role: userRole });
          // Check for profile completion
          if (profile.full_name && profile.department && profile.whatsapp) {
            setIsProfileComplete(true);
          } else {
            setIsProfileComplete(false);
          }
        } else {
          // If profile doesn't exist yet, create a temporary one.
          const temporaryProfile: UserProfile = {
              id: user.id,
              email: user.email || '',
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
              role: userRole,
          };
          setCurrentUser(temporaryProfile);
          setIsProfileComplete(false);
        }

        setIsAdmin(isAdminStatus);
        setIsBlogger(isBloggerStatus);
        setIsMediaManager(isMediaManagerStatus);
        setIsAcademicsManager(isAcademicsManagerStatus);
        setIsPro(isProStatus);
      } else {
        // No user session, clear all user-related state
        setCurrentUser(null);
        setIsAdmin(false);
        setIsBlogger(false);
        setIsMediaManager(false);
        setIsAcademicsManager(false);
        setIsPro(false);
        setIsProfileComplete(false);
      }
    } catch (e) {
      const error = e as Error;
      // This is an expected state for a logged-out user, not an error that needs to be logged.
      if (error && error.message !== 'Auth session missing!') {
        console.error('An error occurred during user session fetch:', e);
      }
      setCurrentUser(null);
      setIsAdmin(false);
      setIsBlogger(false);
      setIsMediaManager(false);
      setIsAcademicsManager(false);
      setIsPro(false);
      setIsProfileComplete(false);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchCurrentUser();

    if (supabase) {
      // FIX: Assuming the error on onAuthStateChange was a red herring as it's a core Supabase method. No changes made here as it should exist.
      // FIX: Casting `supabase.auth` to `any` to bypass TypeScript errors. This suggests a potential mismatch between the installed Supabase client version and its type definitions.
      const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(
        (_event: any, session: any) => {
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
    isAdmin,
    isBlogger,
    isMediaManager,
    isAcademicsManager,
    isPro,
    isProfileComplete,
    refreshCurrentUser: fetchCurrentUser,
  }), [isSidebarOpen, currentUser, isLoading, isAdmin, isBlogger, isMediaManager, isAcademicsManager, isPro, isProfileComplete]);

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