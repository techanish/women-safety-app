import { useState, useEffect, useCallback } from 'react';
import { Location, SafeZone } from '@/types/safety';

interface GeofencingOptions {
  currentLocation: Location | null;
  safeZones: SafeZone[];
  onEnterSafeZone: (zone: SafeZone) => void;
  onExitSafeZone: (zone: SafeZone) => void;
}

export function useGeofencing({
  currentLocation,
  safeZones,
  onEnterSafeZone,
  onExitSafeZone,
}: GeofencingOptions) {
  const [isInSafeZone, setIsInSafeZone] = useState(false);
  const [currentSafeZone, setCurrentSafeZone] = useState<SafeZone | null>(null);
  const [previousZone, setPreviousZone] = useState<SafeZone | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Check if location is within any safe zone
  const checkSafeZones = useCallback(() => {
    if (!currentLocation) return;

    let foundZone: SafeZone | null = null;

    for (const zone of safeZones) {
      if (!zone.isActive) continue;

      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        zone.latitude,
        zone.longitude
      );

      if (distance <= zone.radius) {
        foundZone = zone;
        break;
      }
    }

    // Detect zone transitions
    if (foundZone && !currentSafeZone) {
      // Entered a safe zone
      setIsInSafeZone(true);
      setCurrentSafeZone(foundZone);
      onEnterSafeZone(foundZone);
    } else if (!foundZone && currentSafeZone) {
      // Exited a safe zone
      setIsInSafeZone(false);
      setPreviousZone(currentSafeZone);
      setCurrentSafeZone(null);
      onExitSafeZone(currentSafeZone);
    }
  }, [currentLocation, safeZones, currentSafeZone, calculateDistance, onEnterSafeZone, onExitSafeZone]);

  useEffect(() => {
    checkSafeZones();
  }, [checkSafeZones]);

  return {
    isInSafeZone,
    currentSafeZone,
    previousZone,
    calculateDistance,
  };
}
