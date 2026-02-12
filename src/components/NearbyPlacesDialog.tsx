import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Hospital, Phone, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findNearbyPlaces, getEmergencyNumbers } from '@/lib/nearbyPlaces';
import { useSafety } from '@/contexts/SafetyContext';

interface NearbyPlacesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NearbyPlacesDialog({ open, onOpenChange }: NearbyPlacesDialogProps) {
  const { currentLocation } = useSafety();

  const nearbyPlaces = useMemo(() => {
    if (!currentLocation) return [];
    return findNearbyPlaces(currentLocation.latitude, currentLocation.longitude, 5);
  }, [currentLocation]);

  const emergencyNumbers = useMemo(() => {
    if (!currentLocation) return { police: [], ambulance: [], helpline: [] };
    return getEmergencyNumbers(currentLocation.latitude, currentLocation.longitude);
  }, [currentLocation]);

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nearby Emergency Services</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!currentLocation && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Location unavailable</p>
              <p className="text-xs mt-1">Enable location services to see nearby places</p>
            </div>
          )}

          {currentLocation && (
            <>
              {/* Emergency Numbers */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Helplines
                </h4>
                
                {emergencyNumbers.police.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Police</div>
                    <div className="space-y-1">
                      {emergencyNumbers.police.map((num) => (
                        <Button
                          key={num.number}
                          variant="outline"
                          size="sm"
                          onClick={() => callNumber(num.number)}
                          className="w-full justify-between"
                        >
                          <span className="text-xs">{num.name}</span>
                          <span className="font-mono">{num.number}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {emergencyNumbers.ambulance.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Ambulance</div>
                    <div className="space-y-1">
                      {emergencyNumbers.ambulance.map((num) => (
                        <Button
                          key={num.number}
                          variant="outline"
                          size="sm"
                          onClick={() => callNumber(num.number)}
                          className="w-full justify-between"
                        >
                          <span className="text-xs">{num.name}</span>
                          <span className="font-mono">{num.number}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {emergencyNumbers.helpline.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Women's Helpline</div>
                    <div className="space-y-1">
                      {emergencyNumbers.helpline.map((num) => (
                        <Button
                          key={num.number}
                          variant="outline"
                          size="sm"
                          onClick={() => callNumber(num.number)}
                          className="w-full justify-between"
                        >
                          <span className="text-xs">{num.name}</span>
                          <span className="font-mono">{num.number}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nearby Places */}
              {nearbyPlaces.length > 0 && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Hospital className="w-4 h-4" />
                    Nearby Places
                  </h4>
                  <div className="space-y-2">
                    {nearbyPlaces.map((place, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{place.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {place.type.charAt(0).toUpperCase() + place.type.slice(1)} • {place.distance.toFixed(1)} km away
                            </div>
                            {place.address && (
                              <div className="text-xs text-muted-foreground mt-1">{place.address}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInMaps(place.lat, place.lng, place.name)}
                            title="Open in maps"
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                        {place.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => callNumber(place.phone!)}
                            className="w-full mt-2"
                          >
                            <Phone className="w-3 h-3 mr-2" />
                            {place.phone}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nearbyPlaces.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <Hospital className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No nearby emergency services found</p>
                  <p className="text-xs mt-1">Try moving to a different area</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
