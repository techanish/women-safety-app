import { useState, useEffect, useCallback } from 'react';
import { Location } from '@/types/safety';

interface LocationVisit {
  latitude: number;
  longitude: number;
  visitCount: number;
  lastVisit: number;
  name?: string;
}

interface GPSSettings {
  enableHighAccuracy: boolean;
  maximumAge: number;
  timeout: number;
}

export function useBatteryAwareGPS() {
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [gpsSettings, setGPSSettings] = useState<GPSSettings>({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000,
  });
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [visitedLocations, setVisitedLocations] = useState<LocationVisit[]>(() => {
    const stored = localStorage.getItem('visited_locations');
    return stored ? JSON.parse(stored) : [];
  });

  // Monitor battery status
  useEffect(() => {
    const updateBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const updateBattery = () => {
            setBatteryLevel(battery.level * 100);
            setIsCharging(battery.charging);
          };

          updateBattery();
          
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);

          return () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        } catch (error) {
          console.warn('Battery API not available:', error);
        }
      }
    };

    updateBatteryInfo();
  }, []);

  // Adjust GPS settings based on battery
  useEffect(() => {
    if (isCharging) {
      setGPSSettings({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      });
    } else if (batteryLevel < 20) {
      setGPSSettings({
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 10000,
      });
    } else if (batteryLevel < 50) {
      setGPSSettings({
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 8000,
      });
    } else {
      setGPSSettings({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      });
    }
  }, [batteryLevel, isCharging]);

  const recordVisit = useCallback((location: Location, name?: string) => {
    const PROXIMITY_THRESHOLD = 0.001;

    setVisitedLocations(prev => {
      const existingIndex = prev.findIndex(visit => 
        Math.abs(visit.latitude - location.latitude) < PROXIMITY_THRESHOLD &&
        Math.abs(visit.longitude - location.longitude) < PROXIMITY_THRESHOLD
      );

      let updated: LocationVisit[];
      
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          visitCount: updated[existingIndex].visitCount + 1,
          lastVisit: Date.now(),
          name: name || updated[existingIndex].name,
        };
      } else {
        const newVisit: LocationVisit = {
          latitude: location.latitude,
          longitude: location.longitude,
          visitCount: 1,
          lastVisit: Date.now(),
          name,
        };
        updated = [...prev, newVisit];
      }

      updated.sort((a, b) => b.visitCount - a.visitCount);
      const trimmed = updated.slice(0, 20);
      
      localStorage.setItem('visited_locations', JSON.stringify(trimmed));
      return trimmed;
    });
  }, []);

  const getFrequentLocations = useCallback((limit: number = 5) => {
    return visitedLocations
      .filter(v => v.visitCount >= 3)
      .slice(0, limit)
      .map(v => ({
        lat: v.latitude,
        lon: v.longitude,
        name: v.name || `Visited ${v.visitCount} times`,
      }));
  }, [visitedLocations]);

  const getTileQuality = useCallback(() => {
    if (lowDataMode) return 'low';
    if (batteryLevel < 20 && !isCharging) return 'medium';
    return 'high';
  }, [lowDataMode, batteryLevel, isCharging]);

  const getBatteryMode = useCallback(() => {
    if (isCharging) return 'charging';
    if (batteryLevel < 20) return 'saver';
    if (batteryLevel < 50) return 'balanced';
    return 'normal';
  }, [batteryLevel, isCharging]);

  return {
    batteryLevel,
    isCharging,
    gpsSettings,
    lowDataMode,
    setLowDataMode,
    visitedLocations,
    recordVisit,
    getFrequentLocations,
    getTileQuality,
    getBatteryMode,
  };
}
