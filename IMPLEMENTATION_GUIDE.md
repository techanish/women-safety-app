# Women Safety App - Feature Implementation Guide

## Overview
This document outlines the implemented features for the women safety app, including offline-first functionality, SOS handling, safe zones, and profile management.

## Features Implemented

### 1. **Live GPS Capture with Google Maps Link**
- **Location**: `src/contexts/SafetyContext.tsx`, `src/components/LocationPanel.tsx`
- **Functionality**:
  - Real-time GPS tracking via native geolocation API
  - Generates Google Maps links for current location
  - Share location via native share API or SMS
  - Location included in all SOS alerts

**Usage Example**:
```typescript
const googleMapsUrl = getGoogleMapsUrl(); // Returns Google Maps link
await shareLocation(); // Shares via native share or SMS
```

---

### 2. **Safe Zone Geofencing with Auto-Enable Safe Mode**
- **Location**: `src/hooks/useGeofencing.ts`, `src/contexts/SafetyContext.tsx`
- **Functionality**:
  - Automatically enables safe mode when user enters a safe zone
  - Disables voice detection and camera/mic in safe mode
  - Shows toast notification when entering/leaving zones
  - Disabled features in safe mode:
    - Camera recording
    - Voice command detection
    - Microphone recording for screams

**Configuration**:
```typescript
// Safe zone radius is in meters
addSafeZone({
  name: 'Home',
  latitude: 28.6139,
  longitude: 77.2090,
  radius: 200, // 200 meters
  isActive: true
});
```

---

### 3. **Mic Recording for SOS Triggers (Screams)**
- **Location**: `src/hooks/useVoiceDetection.ts`
- **Functionality**:
  - Continuously listens for predefined SOS trigger keywords
  - Supports English and Hindi keywords
  - Auto-triggers SOS when keyword detected
  - Only works when NOT in safe mode
  - Keywords: "Help me", "Save me", "बचाओ", "मदद", "Bachao", "Help"

**Configuration**:
```typescript
useVoiceDetection({
  keywords: settings.voiceKeywords,
  onKeywordDetected: handleKeywordDetected,
  enabled: voiceDetectionEnabled && !isSafeMode,
  autoTriggerSOS: true
});
```

---

### 4. **Automatic SOS Recording (Audio + Video)**
- **Location**: `src/hooks/useSOSRecording.ts`
- **Functionality**:
  - Automatically starts recording when SOS is triggered
  - Captures both audio and video simultaneously
  - Saves recordings locally to IndexedDB
  - Auto-stops when SOS is cancelled
  - Can be paused/resumed manually

**Auto-Activation**:
```typescript
useSOSRecording({
  includeAudio: true,
  includeVideo: true
});

// Automatically starts when isSOSActive === true
// Automatically saves to alert history
```

---

### 5. **Recording History and Display**
- **Location**: `src/components/AlertHistory.tsx`
- **Functionality**:
  - Shows all alerts (SOS, check-in, safe zone, route deviation)
  - Displays recordings attached to each alert
  - Playback links for audio/video
  - Duration and timestamps
  - Resolution status (resolved/active)

**Data Structure**:
```typescript
interface AlertHistory {
  id: string;
  type: 'sos' | 'checkin' | 'safezone' | 'lowbattery' | 'route_deviation';
  timestamp: number;
  location?: Location;
  resolved: boolean;
  recordings?: AlertRecording[];
  googleMapsUrl?: string;
}

interface AlertRecording {
  id: string;
  type: 'audio' | 'video';
  url: string;
  duration: number;
  timestamp: number;
}
```

---

### 6. **Safe Route Feature**
- **Location**: `src/hooks/useSafeRoute.ts`, `src/components/SafeRoutePanel.tsx`
- **Functionality**:
  - Create multi-waypoint safe routes
  - Activate/deactivate routes
  - Real-time deviation detection (200m threshold)
  - Auto-triggers SOS on deviation
  - Alternative path detection

**Usage**:
```typescript
const {
  routes,
  activeRoute,
  isDeviating,
  deviationDistance,
  startSettingRoute,
  activateRoute,
  deactivateRoute
} = useSafeRoute({ currentLocation, deviationThreshold: 200 });
```

**Route Structure**:
```typescript
interface SafeRoute {
  id: string;
  name: string;
  waypoints: Array<{ latitude: number; longitude: number }>;
  isActive: boolean;
  createdAt: number;
}
```

---

### 7. **Offline-First Authentication (Clerk)**
- **Location**: `src/contexts/AuthContext.tsx`, `src/integrations/clerk.ts`
- **Functionality**:
  - First-time registration: Phone number + OTP via Clerk (online only)
  - Session caching for offline use (24-hour expiration)
  - Never blocks SOS - works offline always
  - JWT token stored securely
  - Automatic session refresh when online

**Implementation**:
```typescript
// First login
await loginWithClerk(phoneNumber, otp, clerkUserId, sessionToken);

// Offline login
await loginOffline(phoneNumber);

// Check session validity
const isValid = isSessionValid();
```

---

### 8. **Offline SOS**
- **Location**: `src/hooks/useOfflineSOS.ts`
- **Functionality**:
  - SOS works 100% offline
  - Saves events to IndexedDB
  - Sends SMS via device SIM (Capacitor/Cordova)
  - Makes emergency calls via device
  - Syncs automatically when online

**Features**:
- SMS via device SIM capability
- Emergency call triggering
- GPS location capture
- Contact queuing for sync

---

### 9. **Offline SOS Sync to Supabase**
- **Location**: `supabase/functions/sync-offline-sos/index.ts`
- **Functionality**:
  - Syncs pending SOS events when online
  - Includes Clerk JWT in request if available
  - Logs to `sos_logs` table
  - Sends SMS confirmations
  - Tracks sync status

**Edge Function**:
```typescript
POST /functions/v1/sync-offline-sos
Body: {
  events: SOSEvent[]
}

Response: {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  syncedEvents: string[];
  failedEvents: string[];
}
```

---

### 10. **Profile Settings**
- **Location**: `src/components/ProfileSettings.tsx`
- **Functionality**:
  - Required fields (first-time setup):
    - Full Name
    - Father's Name
    - Mother's Name
    - Age
    - Phone Number (verified, 10 digits)
    - Email
    - Aadhar Number (12 digits)
    - Address
  
  - Optional fields:
    - Blood Group
    - Profile Photo (max 5MB)
    - Language Preference (English/Hindi/Other)

**Data Validation**:
```typescript
interface UserProfile {
  id: string;
  clerkUserId?: string;
  name: string;
  fatherName: string;
  motherName: string;
  age: number;
  bloodGroup?: string;
  phone: string; // 10-digit validation
  email: string; // Email format validation
  aadharNumber: string; // 12-digit validation
  profilePhoto?: string; // Base64 encoded
  address: string;
  languagePreference: string;
  createdAt: number;
  updatedAt: number;
}
```

---

## Database Structure

### IndexedDB Stores
```typescript
// Pending SOS events (for offline sync)
pendingSOSEvents: {
  id: string;
  type: 'sos' | 'location_update';
  timestamp: number;
  location: Location | null;
  contacts: EmergencyContact[];
  synced: boolean;
  clerkUserId?: string;
}

// User profile
userProfile: {
  id: string;
  clerkUserId?: string;
  name: string;
  phone: string;
  // ... other fields
}

// Safe routes
safeRoutes: {
  id: string;
  name: string;
  waypoints: Array<{ latitude: number; longitude: number }>;
  isActive: boolean;
}

// Media recordings
recordings: {
  id: string;
  alertId: string;
  type: 'audio' | 'video';
  blob: Blob;
  timestamp: number;
  duration: number;
}

// Cached Clerk session
cachedSession: {
  clerkUserId: string;
  sessionToken: string;
  expiresAt: number;
  phoneNumber: string;
  cachedAt: number;
}
```

### Supabase Tables (Optional)
```sql
-- SOS logs table
CREATE TABLE sos_logs (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT,
  event_type TEXT,
  location JSONB,
  contact_count INTEGER,
  timestamp TIMESTAMP,
  synced_at TIMESTAMP,
  recording_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles table (optional)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  email TEXT,
  aadhar_number TEXT,
  profile_photo_url TEXT,
  address TEXT,
  blood_group TEXT,
  language_preference TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Setup Instructions

### 1. Environment Variables
Create `.env` file with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
FAST2SMS_API_KEY=your-fast2sms-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
```

### 2. Supabase Setup
```sql
-- Run migrations to create tables
-- Deploy sync-offline-sos edge function
-- Set up Fast2SMS API integration
```

### 3. Clerk Setup
- Create Clerk project
- Enable phone number verification
- Configure OTP settings

### 4. Install Dependencies
```bash
npm install
# Already included: idb, sonner, @supabase/supabase-js
```

---

## Usage Guide

### For Users

#### **First-Time Setup**
1. Open app
2. Complete profile (required fields)
3. Add emergency contacts
4. Add safe zones (optional)
5. Enable voice commands/shake detection
6. Test fake call feature

#### **Daily Use**
- **Safe Mode**: Automatic in safe zones, manual toggle available
- **Voice Commands**: Say "Help me" or "बचाओ" to trigger SOS
- **Quick Location Share**: Use "Share Location" button
- **Safe Routes**: Create routes, activate for guided travel
- **Check-In**: Set timer to confirm safety at destination

#### **Emergency**
- Tap **SOS button** to instantly trigger alert
- Audio + Video recording starts automatically
- SMS sent to emergency contacts with location
- Location link shared via Google Maps
- Can cancel if false alarm

### For Developers

#### **Adding Custom Keywords**
```typescript
// In SettingsPanel.tsx
const [voiceKeywords, setVoiceKeywords] = useState([
  'Help me', 'Save me', 'बचाओ', 'मदद', 'Your custom keyword'
]);
```

#### **Testing Offline SOS**
1. Add SOS event via `useOfflineSOS.triggerOfflineSOS()`
2. Go offline (DevTools > Network > Offline)
3. Trigger SOS multiple times
4. Go online - events auto-sync
5. Check Supabase `sos_logs` table

#### **Testing Safe Zones**
```typescript
// Add test safe zone
addSafeZone({
  name: 'Test Zone',
  latitude: 28.6139,
  longitude: 77.2090,
  radius: 500,
  isActive: true
});

// Mock location within zone
setCurrentLocation({
  latitude: 28.6139,
  longitude: 77.2090,
  accuracy: 10,
  timestamp: Date.now()
});
```

---

## Security Considerations

1. **Session Caching**: JWT tokens cached with 24-hour expiration
2. **Profile Data**: Stored locally in IndexedDB, encrypted at rest
3. **Aadhar Handling**: Never transmitted, used only for local identification
4. **SMS**: Via Supabase edge functions, never stored
5. **Recordings**: Local storage only, user controls sharing
6. **Offline Safety**: No authentication required for SOS

---

## Troubleshooting

### Issue: Voice detection not working
- Check browser supports Web Speech API
- Verify microphone permissions granted
- Ensure not in safe mode
- Check language setting matches keywords

### Issue: SOS not syncing
- Check internet connection
- Verify Supabase configuration
- Check pending count in IndexedDB
- Manually trigger sync via settings

### Issue: Safe zone not triggering
- Verify zone coordinates correct
- Check radius is in meters
- Enable high accuracy location
- Test with larger radius (500m)

### Issue: Recordings not saving
- Check storage quota available
- Verify camera/mic permissions
- Check IndexedDB is enabled
- Ensure SOS is triggered properly

---

## Future Enhancements

- [ ] Integration with panic buttons/wearables
- [ ] Bluetooth companion device support
- [ ] Real-time location sharing with family
- [ ] AI-powered threat detection
- [ ] Integration with local police databases
- [ ] Multi-language support expansion
- [ ] Offline map caching
- [ ] Emergency fund transfers
- [ ] Legal consultation hotline
- [ ] Counseling integration

---

## Support

For issues or questions, please contact the development team or file an issue in the project repository.
