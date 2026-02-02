import { useState, useEffect, useCallback } from 'react';
import { cacheSession, getCachedSession, clearCachedSession } from '@/lib/offlineDB';
import { toast } from 'sonner';

export interface CachedAuthSession {
  clerkUserId: string;
  sessionToken: string;
  expiresAt: number;
  cachedAt: number;
}

export function useOfflineAuth() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedSession, setCachedSession] = useState<CachedAuthSession | null>(null);
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

  // Load cached session on mount
  useEffect(() => {
    const loadCachedSession = async () => {
      try {
        const cached = await getCachedSession();
        if (cached) {
          // Check if session is still valid (expires at)
          if (cached.expiresAt > Date.now()) {
            setCachedSession(cached as CachedAuthSession);
          } else {
            // Session expired, clear it
            await clearCachedSession();
            setCachedSession(null);
          }
        }
      } catch (error) {
        console.error('Failed to load cached session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCachedSession();
  }, []);

  const saveSession = useCallback(async (session: CachedAuthSession) => {
    try {
      await cacheSession({
        clerkUserId: session.clerkUserId,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        cachedAt: Date.now(),
      });
      setCachedSession(session);
      toast.success('Session saved securely');
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to cache session');
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await clearCachedSession();
      setCachedSession(null);
      toast.success('Session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  const isSessionValid = useCallback(() => {
    if (!cachedSession) return false;
    return cachedSession.expiresAt > Date.now();
  }, [cachedSession]);

  return {
    isOnline,
    cachedSession,
    isLoading,
    isSessionValid: isSessionValid(),
    saveSession,
    clearSession,
  };
}
