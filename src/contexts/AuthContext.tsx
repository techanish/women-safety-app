import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { saveUserProfile, getUserProfile, cacheSession, getCachedSession, clearCachedSession } from '@/lib/offlineDB';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  clerkUserId?: string;
  name: string;
  fatherName: string;
  motherName: string;
  age: number;
  bloodGroup?: string;
  phone: string;
  email: string;
  aadharNumber: string;
  profilePhoto?: string;
  address: string;
  languagePreference: string;
  createdAt: number;
  updatedAt: number;
}

export interface CachedSession {
  clerkUserId: string;
  sessionToken: string;
  expiresAt: number;
  phoneNumber: string;
  cachedAt: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  userProfile: UserProfile | null;
  cachedSession: CachedSession | null;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithClerk: (phoneNumber: string, otp: string, clerkUserId: string, sessionToken: string) => Promise<void>;
  loginOffline: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  isSessionValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cachedSession, setCachedSession] = useState<CachedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load profile and cached session on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) setUserProfile(profile);

        const session = await getCachedSession();
        if (session && session.expiresAt > Date.now()) {
          setCachedSession(session as CachedSession);
        }
      } catch (e) {
        console.error('Failed to load auth data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const current = userProfile || {
      id: crypto.randomUUID(),
      name: '', fatherName: '', motherName: '', age: 0,
      phone: '', email: '', aadharNumber: '', address: '',
      languagePreference: 'English', createdAt: Date.now(), updatedAt: Date.now(),
    };
    const updated: UserProfile = { ...current, ...updates, updatedAt: Date.now() };
    await saveUserProfile(updated);
    setUserProfile(updated);
    toast.success('Profile updated');
  }, [userProfile]);

  const refreshProfile = useCallback(async () => {
    const profile = await getUserProfile();
    if (profile) setUserProfile(profile);
  }, []);

  const loginWithClerk = useCallback(async (
    phoneNumber: string,
    otp: string,
    clerkUserId: string,
    sessionToken: string
  ) => {
    try {
      // Calculate session expiration (24 hours)
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

      // Cache session for offline use
      const session: CachedSession = {
        clerkUserId,
        sessionToken,
        expiresAt,
        phoneNumber,
        cachedAt: Date.now(),
      };
      await cacheSession(session);
      setCachedSession(session);

      // Update profile with Clerk ID
      const profile = userProfile || {
        id: crypto.randomUUID(),
        name: '', fatherName: '', motherName: '', age: 0,
        phone: phoneNumber, email: '', aadharNumber: '', address: '',
        languagePreference: 'English', createdAt: Date.now(), updatedAt: Date.now(),
      };
      
      const updated: UserProfile = {
        ...profile,
        clerkUserId,
        phone: phoneNumber,
        updatedAt: Date.now(),
      };
      
      await saveUserProfile(updated);
      setUserProfile(updated);
      toast.success('Logged in successfully');
    } catch (error) {
      console.error('Clerk login error:', error);
      toast.error('Failed to login with Clerk');
      throw error;
    }
  }, [userProfile]);

  const loginOffline = useCallback(async (phoneNumber: string) => {
    try {
      // For offline login, just create/update profile
      const profile = userProfile || {
        id: crypto.randomUUID(),
        name: '', fatherName: '', motherName: '', age: 0,
        phone: phoneNumber, email: '', aadharNumber: '', address: '',
        languagePreference: 'English', createdAt: Date.now(), updatedAt: Date.now(),
      };
      
      const updated: UserProfile = {
        ...profile,
        phone: phoneNumber,
        updatedAt: Date.now(),
      };
      
      await saveUserProfile(updated);
      setUserProfile(updated);
      toast.success('Logged in with cached session');
    } catch (error) {
      console.error('Offline login error:', error);
      toast.error('Failed to login offline');
      throw error;
    }
  }, [userProfile]);

  const logout = useCallback(async () => {
    try {
      await clearCachedSession();
      setCachedSession(null);
      setUserProfile(null);
      toast.success('Logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  }, []);

  const isSessionValid = useCallback(() => {
    if (!cachedSession) return false;
    return cachedSession.expiresAt > Date.now();
  }, [cachedSession]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!userProfile?.phone && isSessionValid(),
      isLoading,
      isOnline,
      userProfile,
      cachedSession,
      updateProfile,
      refreshProfile,
      loginWithClerk,
      loginOffline,
      logout,
      isSessionValid,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAppAuth must be used within AuthProvider');
  return context;
}
