import { openDB, IDBPDatabase } from 'idb';
import { AlertHistory, EmergencyContact, Location } from '@/types/safety';

interface SafeHerDB {
  pendingSOSEvents: {
    key: string;
    value: {
      id: string;
      type: 'sos' | 'location_update';
      timestamp: number;
      location: Location | null;
      contacts: EmergencyContact[];
      synced: boolean;
      clerkUserId?: string;
    };
    indexes: { 'by-synced': boolean };
  };
  alertHistory: {
    key: string;
    value: AlertHistory & { recordingBlob?: Blob; recordingUrl?: string };
  };
  userProfile: {
    key: string;
    value: {
      id: string;
      clerkUserId?: string;
      name: string;
      fatherName: string;
      motherName: string;
      age: number;
      bloodGroup?: string;
      phone: string;
      email: string;
      aadharNumber: string;
      profilePhoto?: string;
      address: string;
      languagePreference: string;
      createdAt: number;
      updatedAt: number;
    };
  };
  safeRoutes: {
    key: string;
    value: {
      id: string;
      name: string;
      waypoints: Array<{ latitude: number; longitude: number }>;
      isActive: boolean;
      createdAt: number;
    };
  };
  recordings: {
    key: string;
    value: {
      id: string;
      alertId: string;
      type: 'audio' | 'video';
      blob: Blob;
      timestamp: number;
      duration: number;
    };
  };
  cachedSession: {
    key: string;
    value: {
      clerkUserId: string;
      sessionToken: string;
      expiresAt: number;
      cachedAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<SafeHerDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<SafeHerDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SafeHerDB>('safeher-offline', 2, {
    upgrade(db, oldVersion) {
      // Version 1: Initial stores
      if (oldVersion < 1) {
        // Pending SOS events for offline sync
        const sosStore = db.createObjectStore('pendingSOSEvents', { keyPath: 'id' });
        sosStore.createIndex('by-synced', 'synced');

        // Alert history with recordings
        db.createObjectStore('alertHistory', { keyPath: 'id' });

        // User profile
        db.createObjectStore('userProfile', { keyPath: 'id' });

        // Safe routes
        db.createObjectStore('safeRoutes', { keyPath: 'id' });

        // Recordings (audio/video)
        db.createObjectStore('recordings', { keyPath: 'id' });

        // Cached session for offline auth
        db.createObjectStore('cachedSession', { keyPath: 'clerkUserId' });
      }

      // Version 2: Add notifications store
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('by-timestamp', 'timestamp');
          notifStore.createIndex('by-read', 'read');
          notifStore.createIndex('by-category', 'category');
        }
      }
    },
  });

  return dbInstance;
}

// Pending SOS Events
export async function addPendingSOSEvent(event: SafeHerDB['pendingSOSEvents']['value']) {
  const db = await getDB();
  await db.put('pendingSOSEvents', event);
}

export async function getPendingSOSEvents() {
  const db = await getDB();
  const all = await db.getAll('pendingSOSEvents');
  return all.filter(e => !e.synced);
}

export async function markSOSEventSynced(id: string) {
  const db = await getDB();
  const event = await db.get('pendingSOSEvents', id);
  if (event) {
    event.synced = true;
    await db.put('pendingSOSEvents', event);
  }
}

// Alert History
export async function saveAlertToOffline(alert: SafeHerDB['alertHistory']['value']) {
  const db = await getDB();
  await db.put('alertHistory', alert);
}

export async function getOfflineAlerts() {
  const db = await getDB();
  return db.getAll('alertHistory');
}

// User Profile
export async function saveUserProfile(profile: SafeHerDB['userProfile']['value']) {
  const db = await getDB();
  await db.put('userProfile', { ...profile, updatedAt: Date.now() });
}

export async function getUserProfile() {
  const db = await getDB();
  const all = await db.getAll('userProfile');
  return all[0] || null;
}

// Safe Routes
export async function saveSafeRoute(route: SafeHerDB['safeRoutes']['value']) {
  const db = await getDB();
  await db.put('safeRoutes', route);
}

export async function getSafeRoutes() {
  const db = await getDB();
  return db.getAll('safeRoutes');
}

export async function deleteSafeRoute(id: string) {
  const db = await getDB();
  await db.delete('safeRoutes', id);
}

// Recordings
export async function saveRecording(recording: SafeHerDB['recordings']['value']) {
  const db = await getDB();
  await db.put('recordings', recording);
}

export async function getRecordingsForAlert(alertId: string) {
  const db = await getDB();
  const all = await db.getAll('recordings');
  return all.filter(r => r.alertId === alertId);
}

// Cached Session
export async function cacheSession(session: SafeHerDB['cachedSession']['value']) {
  const db = await getDB();
  await db.put('cachedSession', session);
}

export async function getCachedSession() {
  const db = await getDB();
  const all = await db.getAll('cachedSession');
  return all[0] || null;
}

export async function clearCachedSession() {
  const db = await getDB();
  await db.clear('cachedSession');
}
