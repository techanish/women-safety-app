// Service Worker registration and management utilities

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[SW] Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available');
              // You can show a toast here to notify user
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      return null;
    }
  }
  
  console.warn('[SW] Service Workers not supported');
  return null;
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  }
  return false;
}

export async function clearTileCache(): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error('Failed to clear cache'));
        }
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_TILE_CACHE' },
        [messageChannel.port2]
      );
    });
  }
}

export async function getCacheSize(): Promise<{ size: number; maxSize: number }> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        resolve({
          size: event.data.size || 0,
          maxSize: event.data.maxSize || 500,
        });
      };
      
      setTimeout(() => reject(new Error('Timeout')), 5000);
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }
  
  return { size: 0, maxSize: 500 };
}

export interface TileBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function prefetchTilesForArea(
  bounds: TileBounds,
  zoom: number
): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH_TILES',
      bounds,
      zoom,
    });
  }
}

// Calculate bounds for a circular area around a point
export function calculateBounds(
  lat: number,
  lon: number,
  radiusInMeters: number
): TileBounds {
  const latDegreePerMeter = 1 / 111320;
  const lonDegreePerMeter = 1 / (111320 * Math.cos(lat * Math.PI / 180));
  
  const latOffset = radiusInMeters * latDegreePerMeter;
  const lonOffset = radiusInMeters * lonDegreePerMeter;
  
  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lon + lonOffset,
    west: lon - lonOffset,
  };
}
