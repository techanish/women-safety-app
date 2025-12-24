import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Navigation, Share2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSafety } from '@/contexts/SafetyContext';
import { getGoogleMapsLoaderOptions } from '@/lib/googleMaps';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

// Separate component that only renders when API key is available
function GoogleMapView({ apiKey }: { apiKey: string }) {
  const { currentLocation } = useSafety();
  
  const { isLoaded, loadError } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));

  const defaultCenter = {
    lat: currentLocation?.latitude || 12.9716,
    lng: currentLocation?.longitude || 77.5946,
  };

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update map center when location changes
  React.useEffect(() => {
    if (map && currentLocation) {
      map.panTo({ lat: currentLocation.latitude, lng: currentLocation.longitude });
    }
  }, [map, currentLocation]);

   if (loadError) {
    return (
      <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center p-4 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm text-foreground">Google Maps failed to load</p>
          <p className="text-xs text-muted-foreground">
            {String((loadError as any)?.message || loadError)}
          </p>
          <p className="text-xs text-muted-foreground">
            Make sure your Maps JavaScript API is enabled, billing is on, and this site URL is allowed in your API key referrers.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem('google_maps_api_key');
            window.location.reload();
          }}
        >
          Re-enter API Key
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 bg-card flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {currentLocation && (
          <Marker
            position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#f472b6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
      
      {/* Location info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card/90 to-transparent">
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
            <Button variant="glass" size="icon" className="h-8 w-8">
              <Navigation className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon" className="h-8 w-8">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function LocationMap() {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(() => 
    localStorage.getItem('google_maps_api_key') || ''
  );
  const [inputKey, setInputKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);

  const saveApiKey = () => {
    const trimmedKey = inputKey.trim();
    if (trimmedKey && trimmedKey.length > 20) {
      localStorage.setItem('google_maps_api_key', trimmedKey);
      setGoogleMapsApiKey(trimmedKey);
      setKeyError(null);
    } else if (trimmedKey) {
      setKeyError('Invalid API key format');
    }
  };

  // Show input if no API key stored
  if (!googleMapsApiKey) {
    return (
      <div className="relative w-full h-48 rounded-2xl overflow-hidden glass p-4">
        <div className="flex flex-col gap-3 h-full justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Enter Google Maps API key for live maps</span>
          </div>
          <Input
            placeholder="AIzaSy..."
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="bg-muted/50"
          />
          <div className="flex gap-2">
            <Button variant="accent" size="sm" onClick={saveApiKey} className="flex-1">
              Save Key
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
            >
              Get Key
            </Button>
          </div>
          {keyError && (
            <p className="text-xs text-destructive">{keyError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden glass">
      <GoogleMapView apiKey={googleMapsApiKey} />
    </div>
  );
}
