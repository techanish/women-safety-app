import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Location, EmergencyContact } from '@/types/safety';

export function useSMS() {
  const [isSending, setIsSending] = useState(false);

  const sendEmergencySMS = async (
    contacts: EmergencyContact[],
    currentLocation: Location | null,
    liveLocationUrl?: string
  ) => {
    if (contacts.length === 0) {
      toast.error('No emergency contacts configured');
      return false;
    }

    setIsSending(true);
    
    try {
      const phoneNumbers = contacts.map(c => c.phone);
      const message = `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.`;

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers,
          message,
          location: currentLocation,
          liveLocationUrl,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Emergency SMS sent to all contacts');
        return true;
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS error:', error);
      toast.error('Failed to send emergency SMS');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const sendLocationUpdate = async (
    contacts: EmergencyContact[],
    currentLocation: Location | null,
    liveLocationUrl?: string
  ) => {
    if (contacts.length === 0 || !currentLocation) {
      return false;
    }

    try {
      const phoneNumbers = contacts.map(c => c.phone);
      const message = `📍 Location Update from SafeHer:\n\nI'm sharing my current location with you for safety.`;

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers,
          message,
          location: currentLocation,
          liveLocationUrl,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Location shared with contacts');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Location SMS error:', error);
      toast.error('Failed to share location');
      return false;
    }
  };

  return {
    sendEmergencySMS,
    sendLocationUpdate,
    isSending,
  };
}
