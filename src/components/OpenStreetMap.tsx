import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { MapPin, Navigation, Share2, Search, Download, Wifi, WifiOff, Trash2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSafety } from '@/contexts/SafetyContext';
import { useOfflineMaps } from '@/hooks/useOfflineMaps';
import L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import type { SafeZone } from '@/types/safety';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon for current location
const currentLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="8" fill="#f472b6" stroke="#fff" stroke-width="3"/>
      <circle cx="16" cy="16" r="3" fill="#fff"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Safe zone marker icon
const safeZoneIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10" fill="#22c55e" stroke="#fff" stroke-width="3"/>
      <path d="M12 16 L15 19 L20 13" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface MapControllerProps {
  center: [number, number];
  currentLocation: { latitude: number; longitude: number } | null;
}

// Component to update map center when location changes
function MapController({ center, currentLocation }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (currentLocation) {
      map.setView([currentLocation.latitude, currentLocation.longitude], map.getZoom());
    }
  }, [currentLocation, map]);

  return null;
}

// Component for search functionality
function SearchControl() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const map = useMap();
  const provider = useRef(new OpenStreetMapProvider());

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await provider.current.search({ query: searchQuery });
      if (results.length > 0) {
        const { x, y, label } = results[0];
        map.setView([y, x], 15);
        
        // Add a temporary marker for the search result
        const marker = L.marker([y, x]).addTo(map);
        marker.bindPopup(label).openPopup();
        
        // Remove marker after 10 seconds
        setTimeout(() => marker.remove(), 10000);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (!showSearch) {
    return (
      <div className="absolute top-3 left-3 z-[1000]">
        <Button
          variant="glass"
          size="icon"
          className="h-10 w-10 shadow-lg"
          onClick={() => setShowSearch(true)}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
      <Input
        placeholder="Search location..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="bg-card/95 backdrop-blur-sm border-border shadow-lg"
        disabled={isSearching}
      />
      <Button
        variant="glass"
        size="icon"
        onClick={handleSearch}
        disabled={isSearching}
        className="shadow-lg"
      >
        {isSearching ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSearch(false)}
        className="shadow-lg"
      >
        ✕
      </Button>
    </div>
  );
}

// Component to track offline/online status
function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (isOnline) return null;

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span className="text-xs font-medium">Offline Mode</span>
    </div>
  );
}

export function OpenStreetMap() {
  const { currentLocation, safeZones, shareLocation } = useSafety();
  const [showDownloadUI, setShowDownloadUI] = useState(false);
  const [downloadName, setDownloadName] = useState('');
  const [downloadRadius, setDownloadRadius] = useState('1000');
  
  const {
    isOnline,
    cacheSize,
    maxCacheSize,
    offlineAreas,
    isDownloading,
    downloadArea,
    deleteArea,
    clearCache,
    getCacheUsagePercent,
  } = useOfflineMaps();

  const defaultCenter: [number, number] = [
    currentLocation?.latitude || 12.9716,
    currentLocation?.longitude || 77.5946,
  ];

  const handleCenterOnLocation = () => {
    // Trigger re-centering via MapController
    if (currentLocation) {
      // This will be handled by MapController component
    }
  };

  const handleShareLocation = async () => {
    await shareLocation();
  };

  const handleDownloadCurrentArea = async () => {
    if (!currentLocation) return;
    
    const name = downloadName.trim() || 'Current Location';
    const radius = parseInt(downloadRadius) || 1000;
    
    await downloadArea(name, currentLocation.latitude, currentLocation.longitude, radius, 15);
    setDownloadName('');
  };

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        {/* Dark mode tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="text-xs">
                <strong>Current Location</strong>
                <br />
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Safe zones with boundaries */}
        {safeZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Circle
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius}
              pathOptions={{
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
            <Marker
              position={[zone.latitude, zone.longitude]}
              icon={safeZoneIcon}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="text-green-600">{zone.name}</strong>
                  <br />
                  Safe Zone - {zone.radius}m radius
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        <MapController center={defaultCenter} currentLocation={currentLocation} />
        <SearchControl />
      </MapContainer>

      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Location info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card/90 to-transparent backdrop-blur-sm z-[999]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {currentLocation ? (
              <span className="text-xs text-foreground/80">
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Locating...</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="glass"
              size="icon"
              className="h-8 w-8"
              onClick={handleCenterOnLocation}
              title="Center on current location"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="h-8 w-8"
              onClick={handleShareLocation}
              title="Share location"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowDownloadUI(!showDownloadUI)}
              title="Download offline maps"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Download UI overlay */}
      {showDownloadUI && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-card/95 backdrop-blur-sm z-[1001] overflow-y-auto p-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Offline Maps</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDownloadUI(false)}
              >
                ✕
              </Button>
            </div>

            {/* Cache Status */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Storage Used</span>
                </div>
                <span className="font-medium">
                  {cacheSize}/{maxCacheSize} tiles
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  data-width={Math.min(getCacheUsagePercent(), 100)}
                  style={{ width: `${Math.min(getCacheUsagePercent(), 100)}%` } as React.CSSProperties}
                />
              </div>
              {cacheSize > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearCache}
                  className="w-full mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Cache
                </Button>
              )}
            </div>

            {/* Download Current Area */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Download Current Area</h4>
              <Input
                placeholder="Area name (e.g., Home, Work)"
                value={downloadName}
                onChange={(e) => setDownloadName(e.target.value)}
              />
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Radius: {downloadRadius}m
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="500"
                  value={downloadRadius}
                  onChange={(e) => setDownloadRadius(e.target.value)}
                  className="w-full"
                  aria-label="Download radius in meters"
                />
              </div>
              <Button
                variant="accent"
                onClick={handleDownloadCurrentArea}
                disabled={isDownloading || !currentLocation}
                className="w-full"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Area
                  </>
                )}
              </Button>
            </div>

            {/* Downloaded Areas */}
            {offlineAreas.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Downloaded Areas</h4>
                {offlineAreas.map((area) => (
                  <div
                    key={area.id}
                    className="bg-muted/50 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{area.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.radius}m radius • Downloaded{' '}
                        {new Date(area.downloadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteArea(area.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              💡 <strong>Tip:</strong> Download your home, work, and frequently visited
              areas for offline access. Maps will work even without internet!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
