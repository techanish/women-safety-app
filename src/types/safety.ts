export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  isActive: boolean;
}

export interface CheckInTimer {
  id: string;
  duration: number; // in minutes
  startTime: number;
  endTime: number;
  isActive: boolean;
  message?: string;
}

export interface SOSAlert {
  id: string;
  timestamp: number;
  location: Location;
  triggerType: 'button' | 'voice' | 'shake' | 'timer';
  status: 'active' | 'resolved' | 'cancelled';
  recordingUrl?: string;
}

export interface FakeCallSettings {
  callerName: string;
  callerNumber: string;
  ringtone: string;
  delay: number; // in seconds
}

export interface AppSettings {
  voiceCommandEnabled: boolean;
  shakeDetectionEnabled: boolean;
  voiceKeywords: string[];
  language: string;
  sirenEnabled: boolean;
  backgroundTrackingEnabled: boolean;
  lowBatteryAlertEnabled: boolean;
  safeMode: boolean;
}

export interface AlertHistory {
  id: string;
  type: 'sos' | 'checkin' | 'safezone' | 'lowbattery' | 'route_deviation';
  timestamp: number;
  location?: Location;
  resolved: boolean;
  notes?: string;
  recordings?: AlertRecording[];
  googleMapsUrl?: string;
}

export interface AlertRecording {
  id: string;
  type: 'audio' | 'video';
  url: string;
  duration: number;
  timestamp: number;
}
