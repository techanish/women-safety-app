import React from 'react';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

export function LocationMap() {
  const { currentLocation } = useSafety();

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden glass">
      {/* Map placeholder - In production, integrate with Google Maps or Mapbox */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Circular location indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Accuracy circle */}
            <div className="absolute inset-0 -m-8 rounded-full bg-accent/20 animate-pulse" />
            {/* Location dot */}
            <div className="relative w-4 h-4 rounded-full bg-accent shadow-lg shadow-accent/50">
              <div className="absolute inset-0 rounded-full bg-accent animate-ping" />
            </div>
          </div>
        </div>
        
        {/* Location info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card/90 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
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
    </div>
  );
}
