import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmergencyContact, Location, SafeZone, CheckInTimer, AppSettings, SOSAlert } from '@/types/safety';

interface SafetyContextType {
  // State
  currentLocation: Location | null;
  emergencyContacts: EmergencyContact[];
  safeZones: SafeZone[];
  checkInTimer: CheckInTimer | null;
  settings: AppSettings;
  isSOSActive: boolean;
  isSafeMode: boolean;
  
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

  const triggerSOS = (type: SOSAlert['triggerType']) => {
    setIsSOSActive(true);
    // In a real app, this would:
    // - Send SMS to emergency contacts
    // - Start recording
    // - Share location
    // - Play siren
    console.log('SOS Triggered:', type, currentLocation);
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
