import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { EmergencyContact, Location, SafeZone, CheckInTimer, AppSettings, SOSAlert } from '@/types/safety';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SafetyContextType {
  // State
  currentLocation: Location | null;
  emergencyContacts: EmergencyContact[];
  safeZones: SafeZone[];
  checkInTimer: CheckInTimer | null;
  settings: AppSettings;
  isSOSActive: boolean;
  isSafeMode: boolean;
  isSendingSMS: boolean;
  
  // Actions
  setCurrentLocation: (location: Location) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeEmergencyContact: (id: string) => void;
  updateEmergencyContact: (id: string, contact: Partial<EmergencyContact>) => void;
  addSafeZone: (zone: Omit<SafeZone, 'id'>) => void;
  removeSafeZone: (id: string) => void;
  startCheckInTimer: (duration: number, message?: string) => void;
  cancelCheckInTimer: () => void;
  confirmSafe: () => void;
  triggerSOS: (type: SOSAlert['triggerType']) => void;
  cancelSOS: () => void;
  toggleSafeMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  shareLocation: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  voiceCommandEnabled: true,
  shakeDetectionEnabled: true,
  voiceKeywords: ['Help me', 'Save me', 'बचाओ', 'मदद'],
  language: 'en',
  sirenEnabled: true,
  backgroundTrackingEnabled: true,
  lowBatteryAlertEnabled: true,
  safeMode: false,
};

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [checkInTimer, setCheckInTimer] = useState<CheckInTimer | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('emergencyContacts');
    const savedSettings = localStorage.getItem('appSettings');
    const savedSafeZones = localStorage.getItem('safeZones');
    
    if (savedContacts) setEmergencyContacts(JSON.parse(savedContacts));
    if (savedSettings) setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    if (savedSafeZones) setSafeZones(JSON.parse(savedSafeZones));
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('safeZones', JSON.stringify(safeZones));
  }, [safeZones]);

  // Geolocation tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          });
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Send SMS to emergency contacts
  const sendEmergencySMS = useCallback(async (isLiveLocation = false) => {
    if (emergencyContacts.length === 0) {
      toast.error('No emergency contacts configured');
      return false;
    }

    setIsSendingSMS(true);
    
    try {
      const phoneNumbers = emergencyContacts.map(c => c.phone);
      const message = isLiveLocation 
        ? `📍 Location Update from SafeHer:\n\nI'm sharing my current location with you for safety.`
        : `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.`;

      // Generate a live location tracking URL (using Google Maps for simplicity)
      const liveLocationUrl = currentLocation 
        ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
        : undefined;

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
        toast.success(isLiveLocation ? 'Location shared with contacts' : 'Emergency SMS sent to all contacts');
        return true;
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS error:', error);
      toast.error('Failed to send SMS. Check your Fast2SMS configuration.');
      return false;
    } finally {
      setIsSendingSMS(false);
    }
  }, [emergencyContacts, currentLocation]);

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: crypto.randomUUID(),
    };
    setEmergencyContacts(prev => [...prev, newContact]);
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  const updateEmergencyContact = (id: string, contact: Partial<EmergencyContact>) => {
    setEmergencyContacts(prev => 
      prev.map(c => c.id === id ? { ...c, ...contact } : c)
    );
  };

  const addSafeZone = (zone: Omit<SafeZone, 'id'>) => {
    const newZone: SafeZone = {
      ...zone,
      id: crypto.randomUUID(),
    };
    setSafeZones(prev => [...prev, newZone]);
  };

  const removeSafeZone = (id: string) => {
    setSafeZones(prev => prev.filter(z => z.id !== id));
  };

  const startCheckInTimer = (duration: number, message?: string) => {
    const now = Date.now();
    setCheckInTimer({
      id: crypto.randomUUID(),
      duration,
      startTime: now,
      endTime: now + duration * 60 * 1000,
      isActive: true,
      message,
    });
  };

  const cancelCheckInTimer = () => {
    setCheckInTimer(null);
  };

  const confirmSafe = () => {
    setCheckInTimer(null);
    setIsSOSActive(false);
  };

  const triggerSOS = async (type: SOSAlert['triggerType']) => {
    setIsSOSActive(true);
    
    console.log('SOS Triggered:', type, currentLocation);
    
    // Send SMS to emergency contacts
    await sendEmergencySMS(false);
    
    // Play siren if enabled
    if (settings.sirenEnabled) {
      // Siren would be played here
    }
  };

  const cancelSOS = () => {
    setIsSOSActive(false);
  };

  const toggleSafeMode = () => {
    setIsSafeMode(prev => !prev);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const shareLocation = async () => {
    await sendEmergencySMS(true);
  };

  return (
    <SafetyContext.Provider
      value={{
        currentLocation,
        emergencyContacts,
        safeZones,
        checkInTimer,
        settings,
        isSOSActive,
        isSafeMode,
        isSendingSMS,
        setCurrentLocation,
        addEmergencyContact,
        removeEmergencyContact,
        updateEmergencyContact,
        addSafeZone,
        removeSafeZone,
        startCheckInTimer,
        cancelCheckInTimer,
        confirmSafe,
        triggerSOS,
        cancelSOS,
        toggleSafeMode,
        updateSettings,
        shareLocation,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
}
