import { useCallback, useEffect, useState } from 'react';
import { EmergencyContact, Location } from '@/types/safety';
import { addPendingSOSEvent, getPendingSOSEvents, markSOSEventSynced } from '@/lib/offlineDB';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOfflineSOS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

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
  }, []);

  const syncPendingEvents = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const pendingEvents = await getPendingSOSEvents();
      
      for (const event of pendingEvents) {
        try {
          const { error } = await supabase.functions.invoke('send-sms', {
            body: {
              phoneNumbers: event.contacts.map(c => c.phone),
              message: event.type === 'sos' 
                ? `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.`
                : `📍 Location Update from SafeHer:\n\nI'm sharing my current location with you for safety.`,
              location: event.location,
              liveLocationUrl: event.location 
                ? `https://maps.google.com/?q=${event.location.latitude},${event.location.longitude}`
                : undefined,
            },
          });

          if (!error) {
            await markSOSEventSynced(event.id);
          }
        } catch (e) {
          console.error('Failed to sync event:', event.id, e);
        }
      }
      
      toast.success('Synced offline SOS events');
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerOfflineSOS = useCallback(async (
    contacts: EmergencyContact[],
    location: Location | null,
    clerkUserId?: string
  ) => {
    // Store the event offline first
    const eventId = crypto.randomUUID();
    await addPendingSOSEvent({
      id: eventId,
      type: 'sos',
      timestamp: Date.now(),
      location,
      contacts,
      synced: false,
      clerkUserId,
    });

    // Try to send SMS via device if available (for native apps)
    if ('sms' in navigator) {
      try {
        const smsBody = location
          ? `🆘 EMERGENCY! I need help. My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
          : `🆘 EMERGENCY! I need help immediately!`;
        
        for (const contact of contacts) {
          // @ts-ignore - SMS API may not be typed
          await navigator.sms.send(contact.phone, smsBody);
        }
        toast.success('Emergency SMS sent via device');
      } catch (e) {
        console.error('Device SMS failed:', e);
      }
    }

    // Try to make emergency call
    if (contacts.length > 0) {
      const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
      // Create a tel: link for emergency call
      const telLink = document.createElement('a');
      telLink.href = `tel:${primaryContact.phone}`;
      telLink.click();
    }

    // If online, also try API
    if (navigator.onLine) {
      try {
        await supabase.functions.invoke('send-sms', {
          body: {
            phoneNumbers: contacts.map(c => c.phone),
            message: `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.`,
            location,
            liveLocationUrl: location 
              ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
              : undefined,
          },
        });
        await markSOSEventSynced(eventId);
      } catch (e) {
        console.error('API SMS failed, event saved offline:', e);
      }
    } else {
      toast.info('Offline: SOS saved locally. Will sync when online.');
    }

    return eventId;
  }, []);

  return {
    isOnline,
    isSyncing,
    triggerOfflineSOS,
    syncPendingEvents,
  };
}
