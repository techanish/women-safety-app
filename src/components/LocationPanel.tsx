import React from 'react';
import { MapPin, Navigation, Share2, Shield, Plus, Building2, Home as HomeIcon, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

export function LocationPanel() {
  const { currentLocation, safeZones } = useSafety();

  return (
    <div className="flex flex-col h-full p-6 pb-24">
      <h2 className="text-2xl font-display font-bold text-foreground mb-6">Location</h2>

      {/* Current location card */}
      <div className="glass p-4 rounded-2xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/20">
            <Navigation className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Current Location</p>
            <p className="text-sm text-muted-foreground">
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                : 'Locating...'}
            </p>
          </div>
        </div>
        <Button variant="accent" size="sm" className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Share Live Location
        </Button>
      </div>

      {/* Map placeholder */}
      <div className="relative h-48 rounded-2xl overflow-hidden glass mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-full bg-accent/20 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-accent shadow-lg shadow-accent/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Safe Zones */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Safe Zones
          </h3>
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="space-y-2">
          {safeZones.length === 0 ? (
            <div className="glass p-4 rounded-xl text-center">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No safe zones added yet. Add places like home or work.
              </p>
            </div>
          ) : (
            safeZones.map(zone => (
              <div key={zone.id} className="glass p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-safe/20">
                  <HomeIcon className="w-4 h-4 text-safe" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.radius}m radius</p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  zone.isActive ? "bg-safe/20 text-safe" : "bg-muted text-muted-foreground"
                )}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nearby help */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Nearby Help
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="glass p-3 rounded-xl flex items-center gap-2 hover:bg-card/90 transition-all">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Police</span>
          </button>
          <button className="glass p-3 rounded-xl flex items-center gap-2 hover:bg-card/90 transition-all">
            <Building2 className="w-5 h-5 text-safe" />
            <span className="text-sm font-medium">Hospital</span>
          </button>
        </div>
      </div>
    </div>
  );
}
