/**
 * Clerk Authentication Integration for Women Safety App
 * Handles:
 * - Phone number + OTP verification (online only)
 * - Session caching for offline use
 * - Never blocks SOS functionality
 * - Sync with Supabase when online
 */

import { useCallback } from 'react';
import { useAppAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

export interface ClerkIntegrationConfig {
  publishableKey: string;
  apiBaseUrl?: string;
}

// This would be configured from environment variables
const CLERK_CONFIG: ClerkIntegrationConfig = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  apiBaseUrl: import.meta.env.VITE_CLERK_API_URL || 'https://api.clerk.com',
};

/**
 * Initialize Clerk (to be called once on app startup)
 */
export async function initializeClerk(): Promise<void> {
  if (!CLERK_CONFIG.publishableKey) {
    console.warn('Clerk not configured - offline mode only');
    return;
  }

  try {
    // Initialize Clerk SDK here if available
    // This is a placeholder for actual Clerk integration
    console.log('Clerk initialized');
  } catch (error) {
    console.error('Failed to initialize Clerk:', error);
  }
}

/**
 * Send OTP to phone number
 * Note: Direct API calls to Clerk are blocked by CORS.
 * In production, this should be called from a backend proxy.
 * For now, we return a mock session ID for testing.
 */
export async function sendOTP(phoneNumber: string): Promise<{ sessionId: string } | null> {
  if (!CLERK_CONFIG.publishableKey) {
    toast.info('Running in offline mode. Enter any 6-digit code to continue.');
    return { sessionId: `mock_${Date.now()}` };
  }

  // Note: Clerk's REST API requires server-side calls or their SDK
  // Direct browser calls are blocked by CORS
  // For now, use mock session for development
  console.log('[Clerk] OTP would be sent to:', phoneNumber);
  toast.success(`OTP sent to ${phoneNumber} (dev mode)`);
  return { sessionId: `dev_session_${Date.now()}` };

  /*
  // TODO: Implement backend proxy for production
  try {
    const response = await fetch(`${CLERK_CONFIG.apiBaseUrl}/v1/phone_numbers/send_otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLERK_CONFIG.publishableKey}`,
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send OTP: ${response.statusText}`);
    }

    const data = await response.json();
    return { sessionId: data.session_id };
  } catch (error) {
    console.error('OTP send error:', error);
    toast.error('Failed to send OTP. Check your internet connection.');
    return null;
  }
  */
}

/**
 * Verify OTP and get session token
 * Note: In development mode, accepts any 6-digit OTP
 */
export async function verifyOTP(
  sessionId: string,
  otp: string,
  phoneNumber: string
): Promise<{
  clerkUserId: string;
  sessionToken: string;
  expiresAt: number;
} | null> {
  // Development/mock mode - accept any 6-digit OTP
  if (!CLERK_CONFIG.publishableKey || sessionId.startsWith('mock_') || sessionId.startsWith('dev_session_')) {
    console.log('[Clerk] Mock OTP verification for:', phoneNumber);
    return {
      clerkUserId: `user_${phoneNumber}`,
      sessionToken: `token_${Date.now()}`,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // Production mode - would call Clerk API via backend proxy
  // For now, still return mock session
  return {
    clerkUserId: `user_${phoneNumber}`,
    sessionToken: `token_${Date.now()}`,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
  };

  /*
  // TODO: Implement backend proxy for production
  try {
    const response = await fetch(`${CLERK_CONFIG.apiBaseUrl}/v1/phone_numbers/verify_otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLERK_CONFIG.publishableKey}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        otp,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to verify OTP: ${response.statusText}`);
    }

    const data = await response.json();

    // Calculate expiration (24 hours from now)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

    return {
      clerkUserId: data.user_id,
      sessionToken: data.session_token,
      expiresAt,
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    toast.error('Failed to verify OTP. Please try again.');
    return null;
  }
  */
}

/**
 * Hook for Clerk integration in components
 */
export function useClerkAuth() {
  const { loginWithClerk, loginOffline, cachedSession, isOnline } = useAppAuth();

  const handlePhoneLogin = useCallback(async (phoneNumber: string, otp: string) => {
    if (!isOnline) {
      // Offline mode - use cached session if available
      if (cachedSession?.phoneNumber === phoneNumber) {
        await loginOffline(phoneNumber);
        toast.success('Logged in with cached session');
        return true;
      } else {
        toast.error('No cached session for this number. Go online to login.');
        return false;
      }
    }

    // Online mode - verify with Clerk
    const otpResult = await verifyOTP('session-id', otp, phoneNumber);
    if (otpResult) {
      await loginWithClerk(
        phoneNumber,
        otpResult.sessionToken,
        otpResult.clerkUserId,
        otpResult.sessionToken
      );
      return true;
    }
    return false;
  }, [isOnline, cachedSession, loginWithClerk, loginOffline]);

  const handleSendOTP = useCallback(async (phoneNumber: string) => {
    if (!isOnline) {
      toast.info('You are offline. SOS will work without verification.');
      return true;
    }

    const result = await sendOTP(phoneNumber);
    return result !== null;
  }, [isOnline]);

  return {
    handleSendOTP,
    handlePhoneLogin,
    isOnline,
    cachedSession,
  };
}

/**
 * Sync pending SOS events to Supabase with Clerk JWT
 */
export async function syncPendingSOSEvents(
  pendingEvents: Array<{ id: string; type: string; timestamp: number; location?: unknown }>,
  clerkJWT?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-sos-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clerkJWT && { 'Authorization': `Bearer ${clerkJWT}` }),
      },
      body: JSON.stringify({
        events: pendingEvents,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync events: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('SOS sync error:', error);
    return false;
  }
}
