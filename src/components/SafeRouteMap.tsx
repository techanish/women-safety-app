import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GoogleMap, Polyline as GooglePolyline, useJsApiLoader } from '@react-google-maps/api';
import { MapContainer, TileLayer, Polyline as LeafletPolyline, Marker, useMapEvents } from 'react-leaflet';
import { AlertCircle, Wifi, WifiOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Location } from '@/types/safety';
import { getGoogleMapsLoaderOptions } from '@/lib/googleMaps';
import { useOfflineMaps } from '@/hooks/useOfflineMaps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
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

const createWaypointIcon = (num: number) => new L.DivIcon({
  className: 'custom-waypoint-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: white;
    ">${num}</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

type Waypoint = { latitude: number; longitude: number };

interface SafeRouteMapProps {
  currentLocation: Location | null;
  waypoints: Waypoint[];
  onAddWaypoint: (lat: number, lng: number) => void;
}

// Leaflet Map Click Handler
function MapClickHandler({ onAddWaypoint }: { onAddWaypoint: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onAddWaypoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// OpenStreetMap Component for offline support
function OfflineRouteMap({ currentLocation, waypoints, onAddWaypoint }: SafeRouteMapProps) {
  const { isOnline, downloadArea } = useOfflineMaps();
  const [showDownloadBtn, setShowDownloadBtn] = useState(false);

  const center: [number, number] = useMemo(() => {
    if (currentLocation) return [currentLocation.latitude, currentLocation.longitude];
    if (waypoints.length > 0) return [waypoints[0].latitude, waypoints[0].longitude];
    return [12.9716, 77.5946];
  }, [currentLocation, waypoints]);

  const pathPositions: [number, number][] = useMemo(
    () => waypoints.map(wp => [wp.latitude, wp.longitude]),
    [waypoints]
  );

  const handleDownloadArea = async () => {
    if (currentLocation) {
      await downloadArea('Safe Route Area', currentLocation.latitude, currentLocation.longitude, 2000, 15);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapClickHandler onAddWaypoint={onAddWaypoint} />

        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={currentLocationIcon}
          />
        )}

        {waypoints.map((wp, idx) => (
          <Marker
            key={idx}
            position={[wp.latitude, wp.longitude]}
            icon={createWaypointIcon(idx + 1)}
          />
        ))}

        {pathPositions.length >= 2 && (
          <LeafletPolyline
            positions={pathPositions}
            color="#3b82f6"
            weight={4}
            opacity={0.9}
          />
        )}
      </MapContainer>

      {/* Offline/Online Indicator */}
      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        <div className={`rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm ${
          isOnline ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'
        }`}>
          {isOnline ? (
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Online</span>
          ) : (
            <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>
          )}
        </div>
        {currentLocation && (
          <Button
            variant="glass"
            size="icon"
            className="h-7 w-7 shadow-lg"
            onClick={handleDownloadArea}
            title="Download area for offline use"
          >
            <Download className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-background/80 px-2 py-1 text-xs sm:text-sm text-foreground backdrop-blur-sm">
        Tap map to add waypoint
      </div>
    </div>
  );
}

// Google Maps Component
function GoogleRouteMap({ currentLocation, waypoints, onAddWaypoint, apiKey }: SafeRouteMapProps & { apiKey: string }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const center = useMemo(() => {
    if (currentLocation) return { lat: currentLocation.latitude, lng: currentLocation.longitude };
    if (waypoints.length > 0) return { lat: waypoints[0].latitude, lng: waypoints[0].longitude };
    return { lat: 12.9716, lng: 77.5946 };
  }, [currentLocation, waypoints]);

  const path = useMemo(() => waypoints.map(wp => ({ lat: wp.latitude, lng: wp.longitude })), [waypoints]);

  const { isLoaded, loadError } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));
  const [hasApiError, setHasApiError] = useState(false);

  // Listen for API errors
  useEffect(() => {
    const handleApiError = () => {
      console.error('Google Maps API error detected');
      setHasApiError(true);
    };
    window.addEventListener('gm_authfailure', handleApiError);
    return () => window.removeEventListener('gm_authfailure', handleApiError);
  }, []);

  // Cleanup function
  const cleanupMarkers = () => {
    markersRef.current.forEach(marker => {
      try {
        if (marker.setMap) marker.setMap(null);
        else if (marker.map) marker.map = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    markersRef.current = [];
  };

  const cleanupPolyline = () => {
    if (polylineRef.current) {
      try {
        polylineRef.current.setMap(null);
      } catch (e) {
        // Ignore cleanup errors
      }
      polylineRef.current = null;
    }
  };

  // Manage markers and polyline
  useEffect(() => {
    if (!map || !isLoaded || !window.google?.maps) return;

    cleanupMarkers();
    cleanupPolyline();

    try {
      // Check if AdvancedMarkerElement is available
      let useAdvancedMarkers = window.google?.maps?.marker?.AdvancedMarkerElement &&
                                 window.google?.maps?.marker?.PinElement;

      // Add current location marker
      if (currentLocation) {
        let marker;
        if (useAdvancedMarkers) {
          try {
            const pinElement = new google.maps.marker.PinElement({
              background: '#f472b6',
              borderColor: '#fff',
              scale: 1,
            });
            marker = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
              map: map,
              title: 'Current Location',
              content: pinElement.element,
            });
          } catch (e) {
            console.warn('AdvancedMarkerElement failed, using fallback');
            useAdvancedMarkers = false;
          }
        }
        
        if (!useAdvancedMarkers) {
          marker = new google.maps.Marker({
            position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
            map: map,
            title: 'Current Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#f472b6',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
          });
        }
        markersRef.current.push(marker);
      }

      // Add waypoint markers
      waypoints.forEach((wp, idx) => {
        let marker;
        if (useAdvancedMarkers) {
          try {
            const pinElement = new google.maps.marker.PinElement({
              background: '#3b82f6',
              borderColor: '#fff',
              scale: 1.2,
              glyph: String(idx + 1),
              glyphColor: '#fff',
            });
            marker = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: wp.latitude, lng: wp.longitude },
              map: map,
              title: `Waypoint ${idx + 1}`,
              content: pinElement.element,
            });
          } catch (e) {
            console.warn('AdvancedMarkerElement failed for waypoint, using fallback');
            marker = new google.maps.Marker({
              position: { lat: wp.latitude, lng: wp.longitude },
              map: map,
              label: {
                text: String(idx + 1),
                color: '#fff',
                fontWeight: '600',
                fontSize: '12px',
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
              },
              title: `Waypoint ${idx + 1}`,
            });
          }
        } else {
          marker = new google.maps.Marker({
            position: { lat: wp.latitude, lng: wp.longitude },
            map: map,
            label: {
              text: String(idx + 1),
              color: '#fff',
              fontWeight: '600',
              fontSize: '12px',
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
            title: `Waypoint ${idx + 1}`,
          });
        }
        markersRef.current.push(marker);
      });

      // Add polyline for route path
      if (path.length >= 2) {
        polylineRef.current = new google.maps.Polyline({
          path: path,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.9,
          strokeWeight: 4,
          map: map,
        });
      }
    } catch (error) {
      console.error('Error creating markers/polyline:', error);
    }

    return () => {
      cleanupMarkers();
      cleanupPolyline();
    };
  }, [map, currentLocation, waypoints, path, isLoaded]);

  if (loadError || hasApiError) {
    console.error('Google Maps load error:', loadError || 'API authentication failed');
    return <OfflineRouteMap currentLocation={currentLocation} waypoints={waypoints} onAddWaypoint={onAddWaypoint} />;
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center rounded-xl border border-border bg-card">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={15}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onUnmount={() => {
          cleanupMarkers();
          cleanupPolyline();
          setMap(null);
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        }}
        onClick={(e) => {
          if (!e.latLng) return;
          onAddWaypoint(e.latLng.lat(), e.latLng.lng());
        }}
      />

      <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-background/80 px-2 py-1 text-xs sm:text-sm text-foreground backdrop-blur-sm">
        Tap map to add waypoint
      </div>
    </div>
  );
}

// Main Component with fallback support
export function SafeRouteMap({ currentLocation, waypoints, onAddWaypoint }: SafeRouteMapProps) {
  const [apiKey] = useState(() => localStorage.getItem('google_maps_api_key') || '');
  const [useOfflineMap, setUseOfflineMap] = useState(false);

  // Use offline map if no API key or user prefers it
  if (!apiKey || useOfflineMap) {
    return <OfflineRouteMap currentLocation={currentLocation} waypoints={waypoints} onAddWaypoint={onAddWaypoint} />;
  }

  return <GoogleRouteMap currentLocation={currentLocation} waypoints={waypoints} onAddWaypoint={onAddWaypoint} apiKey={apiKey} />;
}
