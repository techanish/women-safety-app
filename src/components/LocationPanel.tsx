import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Share2, Shield, Plus, Building2, Home as HomeIcon, Briefcase, GraduationCap, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { AddSafeZoneDialog } from '@/components/AddSafeZoneDialog';
import { AdvancedOpenStreetMap } from '@/components/AdvancedOpenStreetMap';
import { OfflineMapDialog } from '@/components/OfflineMapDialog';
import { RouteTrackingDialog } from '@/components/RouteTrackingDialog';
import { NearbyPlacesDialog } from '@/components/NearbyPlacesDialog';
import { MapSearchDialog } from '@/components/MapSearchDialog';
import { AddPinDialog } from '@/components/AddPinDialog';
import { useCustomPins } from '@/hooks/useCustomPins';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

export function LocationPanel() {
  const { currentLocation, safeZones, shareLocation, isSendingSMS, removeSafeZone } = useSafety();
  const customPins = useCustomPins();
  const [isAddSafeZoneOpen, setIsAddSafeZoneOpen] = useState(false);
  const [isOfflineMapOpen, setIsOfflineMapOpen] = useState(false);
  const [isRouteTrackingOpen, setIsRouteTrackingOpen] = useState(false);
  const [isNearbyPlacesOpen, setIsNearbyPlacesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [pendingPinLocation, setPendingPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');

  // Reverse geocode current location to get address
  useEffect(() => {
    const getAddress = async () => {
      if (!currentLocation) {
        setLocationAddress('');
        return;
      }

      // Only fetch address if we have reasonable GPS accuracy (less than 100 meters)
      // This prevents showing wrong location while GPS is still getting an accurate fix
      if (currentLocation.accuracy && currentLocation.accuracy > 100) {
        setLocationAddress('Getting accurate location...');
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&format=json&addressdetails=1`
        );
        const data = await response.json();

        if (data.address) {
          // Build a readable address from the components
          const parts = [];
          if (data.address.road) parts.push(data.address.road);
          if (data.address.suburb) parts.push(data.address.suburb);
          if (data.address.city || data.address.town || data.address.village) {
            parts.push(data.address.city || data.address.town || data.address.village);
          }
          if (data.address.state) parts.push(data.address.state);

          setLocationAddress(parts.join(', ') || data.display_name);
        } else {
          setLocationAddress(data.display_name || 'Unknown location');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        // Fallback to coordinates if reverse geocoding fails
        setLocationAddress(`${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`);
      }
    };

    getAddress();
  }, [currentLocation]);

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

  const handleOpenAddPin = () => {
    setIsAddingPin(true);
    setIsAddPinOpen(true);
  };

  const handlePinLocationSelected = (lat: number, lng: number) => {
    setPendingPinLocation({ lat, lng });
  };

  const handleAddPin = (title: string, category: any) => {
    if (pendingPinLocation) {
      customPins.addPin(pendingPinLocation.lat, pendingPinLocation.lng, title, undefined, category);
      toast.success('Pin added');
      setPendingPinLocation(null);
      setIsAddingPin(false);
    }
  };

  const handleSearchLocationSelected = (lat: number, lng: number, label: string) => {
    setSearchLocation({ lat, lng });
    toast.success(`Location found: ${label}`);
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
                ? (locationAddress || 'Loading address...')
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
        <AdvancedOpenStreetMap 
          onOpenDownloadUI={() => setIsOfflineMapOpen(true)}
          onOpenRoutes={() => setIsRouteTrackingOpen(true)}
          onOpenNearbyPlaces={() => setIsNearbyPlacesOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAddPin={handleOpenAddPin}
          showNearbyPlaces={isNearbyPlacesOpen}
          isAddingPin={isAddingPin}
          onPinLocationSelected={handlePinLocationSelected}
          searchLocation={searchLocation}
        />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      <OfflineMapDialog open={isOfflineMapOpen} onOpenChange={setIsOfflineMapOpen} />
      <RouteTrackingDialog open={isRouteTrackingOpen} onOpenChange={setIsRouteTrackingOpen} />
      <NearbyPlacesDialog open={isNearbyPlacesOpen} onOpenChange={setIsNearbyPlacesOpen} />
      <MapSearchDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen}
        onLocationSelected={handleSearchLocationSelected}
      />
      <AddPinDialog
        open={isAddPinOpen}
        onOpenChange={(open) => {
          setIsAddPinOpen(open);
          if (!open) {
            setIsAddingPin(false);
            setPendingPinLocation(null);
          }
        }}
        pendingLocation={pendingPinLocation}
        onAddPin={handleAddPin}
      />
    </div>
  );
}
