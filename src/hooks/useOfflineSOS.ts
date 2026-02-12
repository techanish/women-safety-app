import { useCallback, useEffect, useState } from 'react';
import { EmergencyContact, Location } from '@/types/safety';
import { addPendingSOSEvent, getPendingSOSEvents, markSOSEventSynced } from '@/lib/offlineDB';
import { useSafety } from '@/contexts/SafetyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

export function useOfflineSOS() {
  const { currentLocation, emergencyContacts } = useSafety();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      const pending = await getPendingSOSEvents();
      setPendingCount(pending.length);
    };
    loadPendingCount();
  }, []);

  const syncPendingEvents = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);

    try {
      const pendingEvents = await getPendingSOSEvents();

      for (const event of pendingEvents) {
        try {
          const mapsUrl = event.location
            ? `https://maps.google.com/?q=${event.location.latitude},${event.location.longitude}`
            : undefined;

          const { error } = await supabase.functions.invoke('send-sms', {
            body: {
              phoneNumbers: event.contacts.map(c => c.phone),
              message: event.type === 'sos'
                ? `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.\n\n${mapsUrl ? `📍 Location: ${mapsUrl}` : ''}`
                : `📍 Location Update from SafeHer:\n\nI'm sharing my current location with you for safety.\n\n${mapsUrl ? `View location: ${mapsUrl}` : ''}`,
              location: event.location,
              liveLocationUrl: mapsUrl,
            },
          });

          if (!error) {
            await markSOSEventSynced(event.id);
            toast.success('Offline SOS synced');
          }
        } catch (error) {
          console.error('Failed to sync event:', event.id, error);
        }
      }

      const remaining = await getPendingSOSEvents();
      setPendingCount(remaining.length);
    } catch (error) {
      console.error('Failed to sync pending events:', error);
      toast.error('Failed to sync SOS events');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingEvents();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingEvents]);

  /**
   * Add a pending SOS event (works offline)
   */
  const triggerOfflineSOS = useCallback(async (triggerType: 'button' | 'voice' | 'shake' | 'timer' | 'route_deviation') => {
    try {
      const sosEvent = {
        id: crypto.randomUUID(),
        type: 'sos',
        timestamp: Date.now(),
        location: currentLocation || null,
        contacts: emergencyContacts,
        synced: false,
      };

      await addPendingSOSEvent(sosEvent);
      setPendingCount(prev => prev + 1);

      if (isOnline) {
        // Try to sync immediately if online
        await syncPendingEvents();
      } else {
        toast.info('SOS saved - will sync when online');
      }

      return true;
    } catch (error) {
      console.error('Failed to save offline SOS:', error);
      return false;
    }
  }, [currentLocation, emergencyContacts, isOnline, syncPendingEvents]);

  /**
   * Send emergency SMS using native device capability or Supabase
   */
  const sendEmergencySMS = useCallback(async (phoneNumbers: string[], message: string) => {
    try {
      // Check for Capacitor SMS plugin
      if ((window as any).capacitor?.Plugins?.SMS) {
        const SMS = (window as any).capacitor.Plugins.SMS;
        const result = await SMS.sendSms({ 
          phoneNumbers, 
          message 
        });
        if (result) {
          toast.success('SMS sent via device');
          return true;
        }
      }

      // Fallback to Supabase SMS function
      const { error } = await supabase.functions.invoke('send-sms', {
        body: { phoneNumbers, message },
      });

      if (error) throw error;
      toast.success('SMS sent');
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      toast.error('Failed to send SMS');
      return false;
    }
  }, []);

  /**
   * Make emergency call
   */
  const makeEmergencyCall = useCallback((phoneNumber: string) => {
    try {
      // Check for Capacitor Call plugin
      if ((window as any).capacitor?.Plugins?.Call) {
        const Call = (window as any).capacitor.Plugins.Call;
        Call.makeCall({ number: phoneNumber });
        return true;
      }

      // Fallback to tel: link
      window.location.href = `tel:${phoneNumber}`;
      return true;
    } catch (error) {
      console.error('Call error:', error);
      return false;
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    triggerOfflineSOS,
    syncPendingEvents,
    sendEmergencySMS,
    makeEmergencyCall,
  };
}
