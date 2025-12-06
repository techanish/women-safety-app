import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Share2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSafety } from '@/contexts/SafetyContext';

export function LocationMap() {
  const { currentLocation } = useSafety();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapbox_token') || ''
  );
  const [showTokenInput, setShowTokenInput] = useState(!mapboxToken);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const saveToken = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setShowTokenInput(false);
      setMapError(null);
      initializeMap();
    }
  };

  const initializeMap = async () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      const mapboxgl = await import('mapbox-gl');
      await import('mapbox-gl/dist/mapbox-gl.css');
      
      mapboxgl.default.accessToken = mapboxToken;

      const initialCenter: [number, number] = currentLocation 
        ? [currentLocation.longitude, currentLocation.latitude]
        : [77.5946, 12.9716]; // Default to Bangalore

      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialCenter,
        zoom: 14,
      });

      map.current.addControl(
        new mapboxgl.default.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      // Add user location marker
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse';
      
      marker.current = new mapboxgl.default.Marker(el)
        .setLngLat(initialCenter)
        .addTo(map.current);

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('error', () => {
        setMapError('Invalid Mapbox token');
        localStorage.removeItem('mapbox_token');
        setShowTokenInput(true);
      });

    } catch (error) {
      console.error('Error loading map:', error);
      setMapError('Failed to load map');
    }
  };

  useEffect(() => {
    if (mapboxToken && !showTokenInput) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken, showTokenInput]);

  useEffect(() => {
    if (currentLocation && marker.current && map.current) {
      const coords: [number, number] = [currentLocation.longitude, currentLocation.latitude];
      marker.current.setLngLat(coords);
      map.current.flyTo({ center: coords, zoom: 15 });
    }
  }, [currentLocation]);

  if (showTokenInput) {
    return (
      <div className="relative w-full h-48 rounded-2xl overflow-hidden glass p-4">
        <div className="flex flex-col gap-3 h-full justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Enter Mapbox token for live maps</span>
          </div>
          <Input
            placeholder="pk.eyJ1Ijoi..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="bg-muted/50"
          />
          <div className="flex gap-2">
            <Button variant="accent" size="sm" onClick={saveToken} className="flex-1">
              Save Token
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open('https://mapbox.com/', '_blank')}
            >
              Get Token
            </Button>
          </div>
          {mapError && (
            <p className="text-xs text-destructive">{mapError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden glass">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-card flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
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
    </div>
  );
}
