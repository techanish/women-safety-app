import React, { useState } from 'react';
import { MapPin, Navigation, Share2, Shield, Plus, Building2, Home as HomeIcon, Briefcase, GraduationCap, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { AddSafeZoneDialog } from '@/components/AddSafeZoneDialog';
import { LocationMap } from '@/components/LocationMap';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function LocationPanel() {
  const { currentLocation, safeZones, shareLocation, isSendingSMS, removeSafeZone } = useSafety();
  const [isAddSafeZoneOpen, setIsAddSafeZoneOpen] = useState(false);

  const handleShareLocation = async () => {
    if (!currentLocation) {
      toast.error('Location not available yet');
      return;
    }
    await shareLocation();
  };

  const openNearbyHelp = (type: 'police' | 'hospital') => {
    if (!currentLocation) {
      toast.error('Location not available. Please enable location services.');
      return;
    }
    
    const query = type === 'police' ? 'police+station' : 'hospital';
    const url = `https://www.google.com/maps/search/${query}/@${currentLocation.latitude},${currentLocation.longitude},15z`;
    window.open(url, '_blank');
  };

  const getZoneIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('home')) return HomeIcon;
    if (lowerName.includes('work') || lowerName.includes('office')) return Briefcase;
    if (lowerName.includes('school') || lowerName.includes('college') || lowerName.includes('university')) return GraduationCap;
    return Shield;
  };

  const handleDeleteZone = (id: string, name: string) => {
    removeSafeZone(id);
    toast.success(`Safe zone "${name}" removed`);
  };

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
        <Button 
          variant="accent" 
          size="sm" 
          className="w-full"
          onClick={handleShareLocation}
          disabled={isSendingSMS || !currentLocation}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {isSendingSMS ? 'Sharing...' : 'Share Live Location'}
        </Button>
      </div>

      {/* Live map */}
      <div className="mb-6">
        <LocationMap />
      </div>
      {/* Safe Zones */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Safe Zones
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsAddSafeZoneOpen(true)}>
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
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setIsAddSafeZoneOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Safe Zone
              </Button>
            </div>
          ) : (
            safeZones.map(zone => {
              const ZoneIcon = getZoneIcon(zone.name);
              return (
                <div key={zone.id} className="glass p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-safe/20">
                    <ZoneIcon className="w-4 h-4 text-safe" />
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
                  <button
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                    className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Nearby help */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Nearby Help
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => openNearbyHelp('police')}
            className="glass p-3 rounded-xl flex items-center gap-2 hover:bg-card/90 transition-all active:scale-95"
          >
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Police</span>
          </button>
          <button 
            onClick={() => openNearbyHelp('hospital')}
            className="glass p-3 rounded-xl flex items-center gap-2 hover:bg-card/90 transition-all active:scale-95"
          >
            <Building2 className="w-5 h-5 text-safe" />
            <span className="text-sm font-medium">Hospital</span>
          </button>
        </div>
      </div>

      <AddSafeZoneDialog open={isAddSafeZoneOpen} onOpenChange={setIsAddSafeZoneOpen} />
    </div>
  );
}
