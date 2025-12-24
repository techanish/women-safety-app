import React, { useMemo, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Location } from '@/types/safety';
import { getGoogleMapsLoaderOptions } from '@/lib/googleMaps';

type Waypoint = { latitude: number; longitude: number };

interface SafeRouteMapProps {
  currentLocation: Location | null;
  waypoints: Waypoint[];
  onAddWaypoint: (lat: number, lng: number) => void;
}

export function SafeRouteMap({ currentLocation, waypoints, onAddWaypoint }: SafeRouteMapProps) {
  const [apiKey] = useState(() => localStorage.getItem('google_maps_api_key') || '');

  const center = useMemo(() => {
    if (currentLocation) return { lat: currentLocation.latitude, lng: currentLocation.longitude };
    if (waypoints.length > 0) return { lat: waypoints[0].latitude, lng: waypoints[0].longitude };
    return { lat: 12.9716, lng: 77.5946 };
  }, [currentLocation, waypoints]);

  const path = useMemo(() => waypoints.map(wp => ({ lat: wp.latitude, lng: wp.longitude })), [waypoints]);

  if (!apiKey) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-foreground">Google Maps key not set</p>
        <p className="text-xs text-muted-foreground">
          Add your key in the Home/Location map first, then come back here.
        </p>
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));

  if (loadError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-foreground">Google Maps failed to load</p>
        <p className="text-xs text-muted-foreground">
          {String((loadError as any)?.message || loadError)}
        </p>
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
      >
        {currentLocation && (
          <Marker position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }} />
        )}

        {waypoints.map((wp, idx) => (
          <Marker
            key={`${wp.latitude}-${wp.longitude}-${idx}`}
            position={{ lat: wp.latitude, lng: wp.longitude }}
            label={{
              text: String(idx + 1),
              color: 'hsl(var(--foreground))',
              fontSize: '12px',
              fontWeight: '600',
            }}
          />
        ))}

        {path.length >= 2 && (
          <Polyline
            path={path}
            options={{
              strokeColor: 'hsl(var(--primary))',
              strokeOpacity: 0.9,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>

      <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-background/80 px-2 py-1 text-[11px] text-foreground">
        Tap map to add waypoint
      </div>
    </div>
  );
}
