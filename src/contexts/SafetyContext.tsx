import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { EmergencyContact, Location, SafeZone, CheckInTimer, AppSettings, SOSAlert, AlertHistory, AlertRecording } from '@/types/safety';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useGeofencing } from '@/hooks/useGeofencing';

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
  alertHistory: AlertHistory[];
  currentAlertId: string | null;
  isInSafeZone: boolean;
  currentSafeZone: SafeZone | null;
  voiceDetectionEnabled: boolean;
  
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
  setSafeMode: (value: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  shareLocation: () => Promise<void>;
  addAlertToHistory: (alert: Omit<AlertHistory, 'id'>) => string;
  updateAlertRecordings: (alertId: string, recordings: AlertRecording[]) => void;
  getGoogleMapsUrl: () => string | null;
}

const defaultSettings: AppSettings = {
  voiceCommandEnabled: true,
  shakeDetectionEnabled: true,
  voiceKeywords: ['Help me', 'Save me', 'बचाओ', 'मदद', 'Bachao', 'Help'],
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
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [voiceDetectionEnabled, setVoiceDetectionEnabled] = useState(false);

  // Geofencing integration - auto enable safe mode in safe zones
  const handleEnterSafeZone = useCallback((zone: SafeZone) => {
    toast.success(`Entered safe zone: ${zone.name}`);
    setIsSafeMode(true);
    setVoiceDetectionEnabled(false);
    // Disable camera and mic detection in safe mode
    setSettings(prev => ({
      ...prev,
      safeMode: true,
    }));
  }, []);

  const handleExitSafeZone = useCallback((zone: SafeZone) => {
    toast.warning(`Left safe zone: ${zone.name}`);
    setIsSafeMode(false);
    // Enable voice detection when outside safe zone
    if (settings.voiceCommandEnabled) {
      setVoiceDetectionEnabled(true);
    }
    setSettings(prev => ({
      ...prev,
      safeMode: false,
    }));
  }, [settings.voiceCommandEnabled]);

  const { isInSafeZone, currentSafeZone } = useGeofencing({
    currentLocation,
    safeZones,
    onEnterSafeZone: handleEnterSafeZone,
    onExitSafeZone: handleExitSafeZone,
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('emergencyContacts');
    const savedSettings = localStorage.getItem('appSettings');
    const savedSafeZones = localStorage.getItem('safeZones');
    const savedAlertHistory = localStorage.getItem('alertHistory');
    
    if (savedContacts) setEmergencyContacts(JSON.parse(savedContacts));
    if (savedSettings) setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    if (savedSafeZones) setSafeZones(JSON.parse(savedSafeZones));
    if (savedAlertHistory) setAlertHistory(JSON.parse(savedAlertHistory));
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

  useEffect(() => {
    localStorage.setItem('alertHistory', JSON.stringify(alertHistory));
  }, [alertHistory]);

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

  // Enable voice detection on startup if not in safe zone
  useEffect(() => {
    if (!isInSafeZone && settings.voiceCommandEnabled && !isSafeMode) {
      setVoiceDetectionEnabled(true);
    }
  }, [isInSafeZone, settings.voiceCommandEnabled, isSafeMode]);

  // Get Google Maps URL for current location
  const getGoogleMapsUrl = useCallback(() => {
    if (!currentLocation) return null;
    return `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
  }, [currentLocation]);

  // Send SMS to emergency contacts
  const sendEmergencySMS = useCallback(async (isLiveLocation = false) => {
    if (emergencyContacts.length === 0) {
      toast.error('No emergency contacts configured');
      return false;
    }

    setIsSendingSMS(true);
    
    try {
      const phoneNumbers = emergencyContacts.map(c => c.phone);
      const googleMapsUrl = getGoogleMapsUrl();
      
      const message = isLiveLocation 
        ? `📍 Location Update from SafeHer:\n\nI'm sharing my current location with you for safety.\n\n${googleMapsUrl ? `📍 View my location: ${googleMapsUrl}` : ''}`
        : `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.\n\n${googleMapsUrl ? `📍 My current location: ${googleMapsUrl}` : ''}`;

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers,
          message,
          location: currentLocation,
          liveLocationUrl: googleMapsUrl,
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
  }, [emergencyContacts, currentLocation, getGoogleMapsUrl]);

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

  const addAlertToHistory = useCallback((alert: Omit<AlertHistory, 'id'>): string => {
    const alertId = crypto.randomUUID();
    const googleMapsUrl = getGoogleMapsUrl();
    const newAlert: AlertHistory = {
      ...alert,
      id: alertId,
      googleMapsUrl: googleMapsUrl || undefined,
    };
    setAlertHistory(prev => [newAlert, ...prev]);
    return alertId;
  }, [getGoogleMapsUrl]);

  const updateAlertRecordings = useCallback((alertId: string, recordings: AlertRecording[]) => {
    setAlertHistory(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, recordings } 
          : alert
      )
    );
  }, []);

  const confirmSafe = () => {
    // Update the most recent SOS alert as resolved
    setAlertHistory(prev => {
      const updated = [...prev];
      const lastSOS = updated.find(a => a.type === 'sos' && !a.resolved);
      if (lastSOS) {
        lastSOS.resolved = true;
        lastSOS.notes = 'Confirmed safe by user';
      }
      return updated;
    });
    setCheckInTimer(null);
    setIsSOSActive(false);
    setCurrentAlertId(null);
    toast.success('Marked as safe. Stay alert!');
  };

  const triggerSOS = useCallback(async (type: SOSAlert['triggerType']) => {
    if (isSOSActive) return; // Prevent multiple SOS triggers
    
    setIsSOSActive(true);
    
    console.log('SOS Triggered:', type, currentLocation);
    
    // Add to alert history and get the alert ID
    const alertId = addAlertToHistory({
      type: 'sos',
      timestamp: Date.now(),
      location: currentLocation || undefined,
      resolved: false,
      notes: `Triggered via ${type}`,
    });
    
    setCurrentAlertId(alertId);
    
    // Send SMS to emergency contacts
    await sendEmergencySMS(false);
  }, [isSOSActive, currentLocation, addAlertToHistory, sendEmergencySMS]);

  const cancelSOS = () => {
    // Update the most recent SOS alert as cancelled
    setAlertHistory(prev => {
      const updated = [...prev];
      const lastSOS = updated.find(a => a.type === 'sos' && !a.resolved);
      if (lastSOS) {
        lastSOS.resolved = true;
        lastSOS.notes = 'Cancelled - False alarm';
      }
      return updated;
    });
    setIsSOSActive(false);
    setCurrentAlertId(null);
    
    // Re-enable voice detection if it was enabled before SOS and not in safe zone
    if (settings.voiceCommandEnabled && !isSafeMode && !isInSafeZone) {
      setVoiceDetectionEnabled(true);
    }
    
    toast.info('SOS cancelled');
  };

  const toggleSafeMode = () => {
    setIsSafeMode(prev => {
      const newValue = !prev;
      if (newValue) {
        setVoiceDetectionEnabled(false);
      } else if (settings.voiceCommandEnabled && !isInSafeZone) {
        setVoiceDetectionEnabled(true);
      }
      return newValue;
    });
  };

  const setSafeModeValue = (value: boolean) => {
    setIsSafeMode(value);
    if (value) {
      setVoiceDetectionEnabled(false);
    } else if (settings.voiceCommandEnabled && !isInSafeZone) {
      setVoiceDetectionEnabled(true);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const shareLocation = async () => {
    const googleMapsUrl = getGoogleMapsUrl();
    
    // Try native share first if available
    if (navigator.share && googleMapsUrl) {
      try {
        await navigator.share({
          title: 'My Location - SafeHer',
          text: 'I am sharing my live location with you.',
          url: googleMapsUrl,
        });
        toast.success('Location shared');
        return;
      } catch (e) {
        // User cancelled or share not supported, fallback to SMS
      }
    }
    
    // Send via SMS
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
        alertHistory,
        currentAlertId,
        isInSafeZone,
        currentSafeZone,
        voiceDetectionEnabled,
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
        setSafeMode: setSafeModeValue,
        updateSettings,
        shareLocation,
        addAlertToHistory,
        updateAlertRecordings,
        getGoogleMapsUrl,
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
