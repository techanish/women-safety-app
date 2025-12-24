import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { saveUserProfile, getUserProfile } from '@/lib/offlineDB';
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

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  userProfile: UserProfile | null;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) setUserProfile(profile);
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
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

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!userProfile?.phone,
      isLoading,
      isOnline,
      userProfile,
      updateProfile,
      refreshProfile,
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
