import React, { useState } from 'react';
import { Route, MapPin, Plus, Play, Square, Trash2, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSafety } from '@/contexts/SafetyContext';
import { useSafeRoute } from '@/hooks/useSafeRoute';
import { SafeRouteMap } from '@/components/SafeRouteMap';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
export function SafeRoutePanel({ onClose }: { onClose: () => void }) {
  const { currentLocation, triggerSOS } = useSafety();
  const [routeName, setRouteName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);

  const handleDeviation = (distance: number) => {
    toast.error(`Route deviation detected! ${Math.round(distance)}m from safe route`);
    triggerSOS('button');
  };

  const {
    routes,
    activeRoute,
    isDeviating,
    deviationDistance,
    isSettingRoute,
    tempWaypoints,
    startSettingRoute,
    addWaypoint,
    addCurrentLocationAsWaypoint,
    cancelSettingRoute,
    saveRoute,
    activateRoute,
    deactivateRoute,
    removeRoute,
  } = useSafeRoute({
    currentLocation,
    deviationThreshold: 200,
    onDeviation: handleDeviation,
  });

  const handleSaveRoute = () => {
    if (tempWaypoints.length < 2) {
      toast.error('Add at least 2 waypoints');
      return;
    }
    setShowNameDialog(true);
  };

  const confirmSaveRoute = () => {
    if (!routeName.trim()) {
      toast.error('Please enter a route name');
      return;
    }
    saveRoute(routeName.trim());
    setRouteName('');
    setShowNameDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Safe Routes</h2>
            <p className="text-sm text-muted-foreground">
              Set a route and get alerted if you deviate
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>

        {/* Active Route Warning */}
        {isDeviating && activeRoute && (
          <div className="glass p-4 rounded-2xl mb-4 border-2 border-primary bg-primary/10 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold text-primary">Route Deviation Detected!</p>
                <p className="text-sm text-muted-foreground">
                  You are {Math.round(deviationDistance)}m from your safe route
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Route Display */}
        {activeRoute && !isSettingRoute && (
          <div className="glass p-4 rounded-2xl mb-4 border border-safe/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-safe/20">
                  <Navigation className="w-5 h-5 text-safe" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{activeRoute.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeRoute.waypoints.length} waypoints • Active
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={deactivateRoute}>
                <Square className="w-4 h-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {/* Setting Route Mode */}
        {isSettingRoute ? (
          <div className="flex-1 flex flex-col">
            <div className="glass p-4 rounded-2xl mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-foreground">Setting New Route</p>
                <span className="text-sm text-muted-foreground">
                  {tempWaypoints.length} waypoints
                </span>
              </div>

              <div className="relative h-56 sm:h-64 md:h-72 mb-4">
                <SafeRouteMap
                  currentLocation={currentLocation}
                  waypoints={tempWaypoints}
                  onAddWaypoint={(lat, lng) => {
                    addWaypoint(lat, lng);
                    toast.success('Waypoint added');
                  }}
                />
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                {tempWaypoints.map((wp, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-sm">
                      {wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="accent"
                className="w-full mb-2"
                onClick={addCurrentLocationAsWaypoint}
                disabled={!currentLocation}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Current Location
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Tip: Tap the map to add points, or use “Add Current Location” while you walk.
              </p>
            </div>

            <div className="mt-auto flex gap-2">
              <Button variant="outline" className="flex-1" onClick={cancelSettingRoute}>
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleSaveRoute}
                disabled={tempWaypoints.length < 2}
              >
                Save Route
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Create New Route Button */}
            <Button
              variant="accent"
              className="w-full mb-4"
              onClick={startSettingRoute}
              disabled={!!activeRoute}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Safe Route
            </Button>

            {/* Saved Routes List */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Saved Routes
              </h3>
              
              {routes.length === 0 ? (
                <div className="glass p-6 rounded-2xl text-center">
                  <Route className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No safe routes yet. Create one to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {routes.map(route => (
                    <div key={route.id} className="glass p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Route className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{route.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {route.waypoints.length} waypoints
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => activateRoute(route.id)}
                            disabled={!!activeRoute}
                          >
                            <Play className="w-4 h-4 text-safe" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeRoute(route.id)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Route Name Dialog */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Name Your Route</DialogTitle>
              <DialogDescription>
                Enter a name for your safe route
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g., Home to Office"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSaveRoute}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
