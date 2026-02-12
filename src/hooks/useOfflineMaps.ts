import { useState, useEffect, useCallback } from 'react';
import {
  getCacheSize,
  clearTileCache,
  prefetchTilesForArea,
  calculateBounds,
  type TileBounds,
} from '@/lib/serviceWorker';
import { toast } from '@/lib/toast';

interface OfflineArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  downloadedAt: number;
}

export function useOfflineMaps() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheSize, setCacheSize] = useState(0);
  const [maxCacheSize, setMaxCacheSize] = useState(500);
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [offlineAreas, setOfflineAreas] = useState<OfflineArea[]>(() => {
    const stored = localStorage.getItem('offline_map_areas');
    return stored ? JSON.parse(stored) : [];
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateCacheSize = useCallback(async () => {
    try {
      const { size, maxSize } = await getCacheSize();
      setCacheSize(size);
      setMaxCacheSize(maxSize);
    } catch (error) {
      console.error('Failed to get cache size:', error);
    }
  }, []);

  // Load cache size on mount
  useEffect(() => {
    updateCacheSize();
  }, [updateCacheSize]);

  const downloadArea = useCallback(
    async (
      name: string,
      latitude: number,
      longitude: number,
      radius: number = 1000,
      zoom: number = 15
    ) => {
      if (isDownloading) {
        toast.error('Download already in progress');
        return;
      }

      setIsDownloading(true);
      toast.loading(`Downloading map tiles for ${name}...`);

      try {
        const bounds = calculateBounds(latitude, longitude, radius);
        await prefetchTilesForArea(bounds, zoom);

        const newArea: OfflineArea = {
          id: crypto.randomUUID(),
          name,
          latitude,
          longitude,
          radius,
          downloadedAt: Date.now(),
        };

        const updatedAreas = [...offlineAreas, newArea];
        setOfflineAreas(updatedAreas);
        localStorage.setItem('offline_map_areas', JSON.stringify(updatedAreas));

        await updateCacheSize();
        toast.success(`✅ ${name} downloaded for offline use`);
      } catch (error) {
        console.error('Failed to download area:', error);
        toast.error('Failed to download map tiles');
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading, offlineAreas, updateCacheSize]
  );

  const deleteArea = useCallback(
    (id: string) => {
      const updatedAreas = offlineAreas.filter((area) => area.id !== id);
      setOfflineAreas(updatedAreas);
      localStorage.setItem('offline_map_areas', JSON.stringify(updatedAreas));
      toast.success('Offline area removed');
    },
    [offlineAreas]
  );

  const clearCache = useCallback(async () => {
    try {
      await clearTileCache();
      setOfflineAreas([]);
      localStorage.removeItem('offline_map_areas');
      await updateCacheSize();
      toast.success('Map cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  }, [updateCacheSize]);

  const autoDownloadFrequentAreas = useCallback(
    async (locations: Array<{ lat: number; lon: number; name: string }>) => {
      // Download most frequently visited areas (limit to 3)
      const areasToDownload = locations.slice(0, 3);

      for (const location of areasToDownload) {
        const exists = offlineAreas.some(
          (area) =>
            Math.abs(area.latitude - location.lat) < 0.01 &&
            Math.abs(area.longitude - location.lon) < 0.01
        );

        if (!exists) {
          await downloadArea(location.name, location.lat, location.lon, 1500, 15);
        }
      }
    },
    [downloadArea, offlineAreas]
  );

  const getCacheUsagePercent = useCallback(() => {
    return maxCacheSize > 0 ? (cacheSize / maxCacheSize) * 100 : 0;
  }, [cacheSize, maxCacheSize]);

  return {
    isOnline,
    cacheSize,
    maxCacheSize,
    offlineAreas,
    isDownloading,
    lowDataMode,
    setLowDataMode,
    downloadArea,
    deleteArea,
    clearCache,
    updateCacheSize,
    autoDownloadFrequentAreas,
    getCacheUsagePercent,
  };
}
