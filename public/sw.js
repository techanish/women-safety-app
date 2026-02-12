// Service Worker for Offline Map Tiles Caching
const CACHE_NAME = 'safeher-maps-v1';
const TILE_CACHE_NAME = 'safeher-map-tiles-v1';
const MAX_TILE_CACHE_SIZE = 500; // Maximum number of tiles to cache

// List of tile providers
const TILE_SERVERS = [
  'basemaps.cartocdn.com',
  'tile.openstreetmap.org',
  'unpkg.com/leaflet'
];

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== TILE_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip caching for unsupported schemes and methods
  const url = new URL(event.request.url);
  
  // Only handle http/https requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Check if it's a map tile request
  const isTileRequest = TILE_SERVERS.some(server => url.hostname.includes(server));
  
  if (isTileRequest) {
    // Cache-first strategy for map tiles
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log('[ServiceWorker] Serving tile from cache:', url.pathname);
          return response;
        }
        
        // Fetch from network and cache
        return fetch(event.request).then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            
            caches.open(TILE_CACHE_NAME).then((cache) => {
              // Limit cache size
              cache.keys().then((keys) => {
                if (keys.length >= MAX_TILE_CACHE_SIZE) {
                  // Remove oldest entry
                  cache.delete(keys[0]);
                }
                cache.put(event.request, responseToCache);
                console.log('[ServiceWorker] Cached new tile:', url.pathname);
              });
            });
          }
          
          return networkResponse;
        }).catch((error) => {
          console.log('[ServiceWorker] Tile fetch failed, serving offline fallback');
          // Return a blank tile or cached version
          return caches.match(event.request);
        });
      })
    );
  } else {
    // Network-first strategy for other resources
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache
          return caches.match(event.request);
        })
    );
  }
});

// Message event - for cache management commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_TILE_CACHE') {
    event.waitUntil(
      caches.delete(TILE_CACHE_NAME).then(() => {
        console.log('[ServiceWorker] Tile cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open(TILE_CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          event.ports[0].postMessage({ 
            size: keys.length,
            maxSize: MAX_TILE_CACHE_SIZE
          });
        });
      })
    );
  }
  
  if (event.data && event.data.type === 'PREFETCH_TILES') {
    const { bounds, zoom } = event.data;
    event.waitUntil(prefetchTiles(bounds, zoom));
  }
});

// Function to prefetch map tiles for a specific area
async function prefetchTiles(bounds, zoom) {
  const { north, south, east, west } = bounds;
  const tiles = [];
  
  // Calculate tile coordinates from lat/lon bounds
  for (let z = zoom - 1; z <= zoom + 1; z++) {
    const minTile = latLonToTile(north, west, z);
    const maxTile = latLonToTile(south, east, z);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        tiles.push({ x, y, z });
      }
    }
  }
  
  console.log(`[ServiceWorker] Prefetching ${tiles.length} tiles`);
  
  const cache = await caches.open(TILE_CACHE_NAME);
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
  
  for (const tile of tiles.slice(0, 100)) { // Limit to 100 tiles per request
    const url = tileUrl
      .replace('{s}', 'a')
      .replace('{z}', tile.z)
      .replace('{x}', tile.x)
      .replace('{y}', tile.y);
    
    try {
      const response = await fetch(url);
      if (response && response.status === 200) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to prefetch tile:', tile);
    }
  }
  
  console.log('[ServiceWorker] Prefetch complete');
}

// Convert lat/lon to tile coordinates
function latLonToTile(lat, lon, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
  );
  return { x, y };
}
