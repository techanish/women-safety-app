import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Route, Trash2 } from 'lucide-react';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { toast } from '@/hooks/use-toast';

interface RouteTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RouteTrackingDialog({ open, onOpenChange }: RouteTrackingDialogProps) {
  const locationTracking = useLocationTracking();

  const handleStartTracking = () => {
    locationTracking.startTracking();
    toast({ title: "Tracking started", description: "Your route is being recorded" });
  };

  const handleStopTracking = () => {
    locationTracking.stopTracking();
    toast({ title: "Tracking stopped", description: "Route saved successfully" });
  };

  const handleExportJSON = (track: any) => {
    locationTracking.exportTrack(track);
    toast({ title: "Exported", description: "Route exported as JSON" });
  };

  const handleExportGPX = (track: any) => {
    locationTracking.exportToGPX(track);
    toast({ title: "Exported", description: "Route exported as GPX" });
  };

  const handleDeleteTrack = (id: string) => {
    locationTracking.deleteTrack(id);
    toast({ title: "Deleted", description: "Route removed" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Route Tracking</DialogTitle>
          <DialogDescription>
            Monitoring your location against the active route
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tracking Control */}
          <div className="space-y-2">
            {!locationTracking.isTracking ? (
              <Button variant="accent" onClick={handleStartTracking} className="w-full">
                <Route className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Tracking Active</div>
                  <div className="text-xs text-muted-foreground">
                    Points: {locationTracking.currentTrack?.points.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Distance: {((locationTracking.currentTrack?.distance || 0) / 1000).toFixed(2)} km
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {Math.floor(((locationTracking.currentTrack?.endTime || Date.now()) - (locationTracking.currentTrack?.startTime || Date.now())) / 60000)} min
                  </div>
                </div>
                <Button variant="destructive" onClick={handleStopTracking} className="w-full">
                  Stop Tracking
                </Button>
              </div>
            )}
          </div>

          {/* Saved Routes */}
          {locationTracking.tracks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Saved Routes</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {locationTracking.tracks.map((track) => (
                  <div key={track.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="space-y-1 mb-3">
                      <div className="text-sm font-medium">
                        {new Date(track.startTime).toLocaleDateString()} {new Date(track.startTime).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(track.distance / 1000).toFixed(2)} km • {track.points.length} points
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Duration: {Math.floor((track.endTime - track.startTime) / 60000)} min
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExportJSON(track)}
                        className="flex-1"
                      >
                        Export JSON
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExportGPX(track)}
                        className="flex-1"
                      >
                        Export GPX
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteTrack(track.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {locationTracking.tracks.length === 0 && !locationTracking.isTracking && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Route className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No routes tracked yet</p>
              <p className="text-xs mt-1">Start tracking to record your journey</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
