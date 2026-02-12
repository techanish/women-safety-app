import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import {
  MapPin, Navigation, Share2, Search, Download, WifiOff, Trash2, HardDrive,
  Plus, Battery, BatteryLow, BatteryCharging, Wifi, Route, Hospital, Shield, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSafety } from '@/contexts/SafetyContext';
import { useOfflineMaps } from '@/hooks/useOfflineMaps';
import { useBatteryAwareGPS } from '@/hooks/useBatteryAwareGPS';
import { useCustomPins, getPinIcon, type CustomPin } from '@/hooks/useCustomPins';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { findNearbyPlaces, type NearbyPlace } from '@/lib/nearbyPlaces';
import L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import { toast } from '@/lib/toast';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

function createEmergencyIcon(type: NearbyPlace['type']) {
  const colors = {
    police: '#3b82f6',
    hospital: '#ef4444',
    pharmacy: '#22c55e',
    fire_station: '#f59e0b',
    women_helpline: '#ec4899',
  };
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="${colors[type]}" stroke="#fff" stroke-width="2"/>
        <text x="14" y="18" text-anchor="middle" font-size="14" fill="#fff">⚕</text>
      </svg>
    `),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Map click handler for adding pins
function MapClickHandler({ isAddingPin, onAddPin }: { isAddingPin: boolean; onAddPin: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (isAddingPin) {
        onAddPin(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Recenter control - handles map recentering
function RecenterControl({ currentLocation, shouldRecenter, onRecentered }: {
  currentLocation: { latitude: number; longitude: number } | null;
  shouldRecenter: boolean;
  onRecentered: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (shouldRecenter && currentLocation) {
      map.flyTo([currentLocation.latitude, currentLocation.longitude], 15, {
        duration: 1.5
      });
      onRecentered();
    }
  }, [shouldRecenter, currentLocation, map, onRecentered]);

  return null;
}

function StatusIndicators({ 
  isOnline, 
  batteryLevel, 
  isCharging, 
  batteryMode,
  lowDataMode,
  onToggleLowData 
}: { 
  isOnline: boolean;
  batteryLevel: number;
  isCharging: boolean;
  batteryMode: string;
  lowDataMode: boolean;
  onToggleLowData: () => void;
}) {
  const getBatteryIcon = () => {
    if (isCharging) return <BatteryCharging className="w-4 h-4" />;
    if (batteryLevel < 20) return <BatteryLow className="w-4 h-4" />;
    return <Battery className="w-4 h-4" />;
  };

  return (
    <div className="absolute top-3 right-3 z-[30] flex flex-col gap-2">
      {!isOnline && (
        <div className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs font-medium">Offline</span>
        </div>
      )}
      
      {batteryMode === 'saver' && (
        <div className="bg-warning/90 text-warning-foreground px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
          {getBatteryIcon()}
          <span className="text-xs font-medium">{Math.round(batteryLevel)}% - Saver Mode</span>
        </div>
      )}
      
      <Button
        variant={lowDataMode ? "accent" : "glass"}
        size="sm"
        onClick={onToggleLowData}
        className="shadow-lg"
        title={lowDataMode ? "Low data mode ON" : "Low data mode OFF"}
      >
        <Wifi className="w-3 h-3 mr-1" />
        <span className="text-xs">{lowDataMode ? "Low Data" : "Normal"}</span>
      </Button>
    </div>
  );
}

interface AdvancedOpenStreetMapProps {
  onOpenDownloadUI?: () => void;
  onOpenRoutes?: () => void;
  onOpenNearbyPlaces?: () => void;
  onOpenSearch?: () => void;
  onOpenAddPin?: () => void;
  showNearbyPlaces?: boolean;
  isAddingPin?: boolean;
  onPinLocationSelected?: (lat: number, lng: number) => void;
  searchLocation?: { lat: number; lng: number } | null;
}

export function AdvancedOpenStreetMap({
  onOpenDownloadUI,
  onOpenRoutes,
  onOpenNearbyPlaces,
  onOpenSearch,
  onOpenAddPin,
  showNearbyPlaces = false,
  isAddingPin = false,
  onPinLocationSelected,
  searchLocation
}: AdvancedOpenStreetMapProps) {
  const { currentLocation, safeZones, shareLocation } = useSafety();

  const offlineMaps = useOfflineMaps();
  const batteryGPS = useBatteryAwareGPS();
  const customPins = useCustomPins();
  const locationTracking = useLocationTracking();

  const [nearbyPlaces, setNearbyPlaces] = useState<Array<NearbyPlace & { distance: number }>>([]);
  const [shouldRecenter, setShouldRecenter] = useState(false);

  const defaultCenter: [number, number] = [
    currentLocation?.latitude || 12.9716,
    currentLocation?.longitude || 77.5946,
  ];

  // Auto-cache frequent locations
  useEffect(() => {
    if (currentLocation) {
      batteryGPS.recordVisit(currentLocation);

      const frequentLocs = batteryGPS.getFrequentLocations(3);
      if (frequentLocs.length > 0) {
        offlineMaps.autoDownloadFrequentAreas(frequentLocs);
      }
    }
    // batteryGPS and offlineMaps are stable references from hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // Track location if tracking is enabled
  useEffect(() => {
    if (locationTracking.isTracking && currentLocation) {
      locationTracking.addLocationPoint(
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
    // locationTracking is a stable reference from hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, locationTracking.isTracking]);

  // Load nearby places
  useEffect(() => {
    if (currentLocation && showNearbyPlaces) {
      const places = findNearbyPlaces(
        currentLocation.latitude,
        currentLocation.longitude,
        undefined,
        5 // 5km radius
      );
      setNearbyPlaces(places);
    }
  }, [currentLocation, showNearbyPlaces]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onPinLocationSelected) {
      onPinLocationSelected(lat, lng);
    }
  }, [onPinLocationSelected]);

  const handleRecenter = () => {
    if (!currentLocation) {
      toast.error('Location not available yet');
      return;
    }
    setShouldRecenter(true);
    toast.success('Centering map on your location');
  };

  const handleRecentered = useCallback(() => {
    setShouldRecenter(false);
  }, []);

  const getTileUrl = () => {
    const quality = batteryGPS.getTileQuality();
    if (quality === 'low' || offlineMaps.lowDataMode) {
      // Use lower quality tiles or older version
      return 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
    }
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden isolate">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        <MapClickHandler isAddingPin={isAddingPin} onAddPin={handleMapClick} />
        <RecenterControl
          currentLocation={currentLocation}
          shouldRecenter={shouldRecenter}
          onRecentered={handleRecentered}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={getTileUrl()}
        />

        {/* Current location */}
        {currentLocation && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={currentLocationIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="font-semibold">Current Location</strong><br />
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Safe zones */}
        {safeZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Circle center={[zone.latitude, zone.longitude]} radius={zone.radius} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 }} />
            <Marker position={[zone.latitude, zone.longitude]} icon={safeZoneIcon}>
              <Popup><div className="text-xs"><strong className="text-green-600">{zone.name}</strong><br />{zone.radius}m radius</div></Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Route tracking */}
        {locationTracking.currentTrack && locationTracking.currentTrack.points.length > 1 && (
          <Polyline
            positions={locationTracking.currentTrack.points.map(p => [p.latitude, p.longitude] as [number, number])}
            pathOptions={{ color: '#f472b6', weight: 3, opacity: 0.7 }}
          />
        )}

        {/* Custom pins */}
        {customPins.pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={new L.Icon({ iconUrl: getPinIcon(pin.category, pin.color), iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42] })}
          >
            <Popup>
              <div className="text-xs">
                <strong>{pin.title}</strong>
                {pin.description && <><br />{pin.description}</>}
                <br /><Button variant="ghost" size="sm" onClick={() => customPins.deletePin(pin.id)} className="mt-1"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Nearby emergency places */}
        {showNearbyPlaces && nearbyPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createEmergencyIcon(place.type)}
          >
            <Popup>
              <div className="text-xs">
                <strong>{place.name}</strong><br />
                {place.address}<br />
                {place.phone && <>{place.phone}<br /></>}
                {place.distance.toFixed(2)} km away
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <StatusIndicators
        isOnline={offlineMaps.isOnline}
        batteryLevel={batteryGPS.batteryLevel}
        isCharging={batteryGPS.isCharging}
        batteryMode={batteryGPS.getBatteryMode()}
        lowDataMode={batteryGPS.lowDataMode}
        onToggleLowData={() => batteryGPS.setLowDataMode(!batteryGPS.lowDataMode)}
      />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card/90 to-transparent backdrop-blur-sm z-[20]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            {currentLocation ? (
              <span className="text-xs text-foreground/80 truncate">
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Locating...</span>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="glass" size="icon" className="h-11 w-11" onClick={handleRecenter} title="Recenter to my location">
              <Crosshair className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon" className="h-11 w-11" onClick={onOpenSearch} title="Search location">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant={isAddingPin ? "accent" : "glass"} size="icon" className="h-11 w-11" onClick={onOpenAddPin} title="Add pin">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon" className="h-11 w-11" onClick={onOpenRoutes} title="Route tracking">
              <Route className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon" className="h-11 w-11" onClick={onOpenNearbyPlaces} title="Nearby places">
              <Hospital className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon" className="h-11 w-11" onClick={shareLocation} title="Share location">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon" className="h-11 w-11" onClick={onOpenDownloadUI} title="Offline maps">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}