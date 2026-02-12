import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
}

export interface LocationTrack {
  id: string;
  startTime: number;
  endTime?: number;
  points: LocationPoint[];
  distance: number; // in meters
  isActive: boolean;
}

const DB_NAME = 'SafeHerLocationDB';
const STORE_NAME = 'locationTracks';
const DB_VERSION = 1;

export function useLocationTracking(enabled: boolean = false) {
  const [currentTrack, setCurrentTrack] = useState<LocationTrack | null>(null);
  const [tracks, setTracks] = useState<LocationTrack[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const dbRef = useRef<IDBPDatabase | null>(null);

  const loadTracks = useCallback(async () => {
    if (!dbRef.current) return;

    try {
      const allTracks = await dbRef.current.getAll(STORE_NAME);
      setTracks(allTracks.sort((a, b) => b.startTime - a.startTime));
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  }, []);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        },
      });
      dbRef.current = db;
      await loadTracks();
    };

    initDB();

    return () => {
      dbRef.current?.close();
    };
  }, [loadTracks]);

  const startTracking = useCallback(() => {
    const newTrack: LocationTrack = {
      id: `track-${Date.now()}`,
      startTime: Date.now(),
      points: [],
      distance: 0,
      isActive: true,
    };
    setCurrentTrack(newTrack);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(async () => {
    if (!currentTrack || !dbRef.current) return;

    const finishedTrack: LocationTrack = {
      ...currentTrack,
      endTime: Date.now(),
      isActive: false,
    };

    // Save to IndexedDB
    try {
      await dbRef.current.put(STORE_NAME, finishedTrack);
      await loadTracks();
    } catch (error) {
      console.error('Failed to save track:', error);
    }

    setCurrentTrack(null);
    setIsTracking(false);
  }, [currentTrack, loadTracks]);

  const addLocationPoint = useCallback(
    (latitude: number, longitude: number, accuracy?: number, speed?: number) => {
      if (!isTracking || !currentTrack) return;

      const newPoint: LocationPoint = {
        id: `point-${Date.now()}`,
        latitude,
        longitude,
        timestamp: Date.now(),
        accuracy,
        speed,
      };

      const updatedPoints = [...currentTrack.points, newPoint];
      
      // Calculate distance if there's a previous point
      let newDistance = currentTrack.distance;
      if (currentTrack.points.length > 0) {
        const lastPoint = currentTrack.points[currentTrack.points.length - 1];
        newDistance += calculateDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          latitude,
          longitude
        );
      }

      const updatedTrack: LocationTrack = {
        ...currentTrack,
        points: updatedPoints,
        distance: newDistance,
      };

      setCurrentTrack(updatedTrack);
    },
    [isTracking, currentTrack]
  );

  const deleteTrack = useCallback(async (trackId: string) => {
    if (!dbRef.current) return;

    try {
      await dbRef.current.delete(STORE_NAME, trackId);
      await loadTracks();
    } catch (error) {
      console.error('Failed to delete track:', error);
    }
  }, [loadTracks]);

  const clearAllTracks = useCallback(async () => {
    if (!dbRef.current) return;

    try {
      const tx = dbRef.current.transaction(STORE_NAME, 'readwrite');
      await tx.objectStore(STORE_NAME).clear();
      await tx.done;
      setTracks([]);
    } catch (error) {
      console.error('Failed to clear tracks:', error);
    }
  }, []);

  const exportTrack = useCallback((track: LocationTrack) => {
    const data = {
      id: track.id,
      startTime: new Date(track.startTime).toISOString(),
      endTime: track.endTime ? new Date(track.endTime).toISOString() : null,
      duration: track.endTime ? track.endTime - track.startTime : null,
      distance: track.distance,
      points: track.points.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: new Date(p.timestamp).toISOString(),
        accuracy: p.accuracy,
        speed: p.speed,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-track-${new Date(track.startTime).toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToGPX = useCallback((track: LocationTrack) => {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SafeHer App">
  <trk>
    <name>SafeHer Track ${new Date(track.startTime).toLocaleDateString()}</name>
    <trkseg>
${track.points.map(p => `      <trkpt lat="${p.latitude}" lon="${p.longitude}">
        <time>${new Date(p.timestamp).toISOString()}</time>
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-track-${new Date(track.startTime).toISOString()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    currentTrack,
    tracks,
    isTracking,
    startTracking,
    stopTracking,
    addLocationPoint,
    deleteTrack,
    clearAllTracks,
    exportTrack,
    exportToGPX,
  };
}

// Calculate distance using Haversine formula (returns meters)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
