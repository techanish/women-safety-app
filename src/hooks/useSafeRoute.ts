import { useState, useEffect, useCallback, useRef } from 'react';
import { Location } from '@/types/safety';
import { saveSafeRoute, getSafeRoutes, deleteSafeRoute } from '@/lib/offlineDB';
import { toast } from 'sonner';

export interface SafeRoute {
  id: string;
  name: string;
  waypoints: Array<{ latitude: number; longitude: number }>;
  isActive: boolean;
  createdAt: number;
}

interface SafeRouteOptions {
  currentLocation: Location | null;
  deviationThreshold?: number; // in meters, default 200
  onDeviation: (distance: number) => void;
}

export function useSafeRoute({ currentLocation, deviationThreshold = 200, onDeviation }: SafeRouteOptions) {
  const [routes, setRoutes] = useState<SafeRoute[]>([]);
  const [activeRoute, setActiveRoute] = useState<SafeRoute | null>(null);
  const [isDeviating, setIsDeviating] = useState(false);
  const [deviationDistance, setDeviationDistance] = useState(0);
  const [isSettingRoute, setIsSettingRoute] = useState(false);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const lastDeviationCheckRef = useRef<number>(0);

  // Load routes from IndexedDB
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const savedRoutes = await getSafeRoutes();
    setRoutes(savedRoutes);
    const active = savedRoutes.find(r => r.isActive);
    if (active) {
      setActiveRoute(active);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Calculate minimum distance from current location to route path
  const calculateDistanceToRoute = useCallback((location: Location, waypoints: Array<{ latitude: number; longitude: number }>): number => {
    if (waypoints.length < 2) return Infinity;

    let minDistance = Infinity;

    // Check distance to each segment of the route
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      // Calculate distance to line segment
      const distance = distanceToSegment(
        location.latitude, location.longitude,
        start.latitude, start.longitude,
        end.latitude, end.longitude
      );

      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }, []);

  // Helper function to calculate distance to a line segment
  const distanceToSegment = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return calculateDistance(px, py, x1, y1);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / (length * length);
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return calculateDistance(px, py, nearestX, nearestY);
  };

  // Check for route deviation
  useEffect(() => {
    if (!activeRoute || !currentLocation) return;

    // Throttle checks to avoid excessive calculations
    const now = Date.now();
    if (now - lastDeviationCheckRef.current < 5000) return;
    lastDeviationCheckRef.current = now;

    const distance = calculateDistanceToRoute(currentLocation, activeRoute.waypoints);
    setDeviationDistance(distance);

    if (distance > deviationThreshold) {
      if (!isDeviating) {
        setIsDeviating(true);
        onDeviation(distance);
      }
    } else {
      setIsDeviating(false);
    }
  }, [currentLocation, activeRoute, deviationThreshold, calculateDistanceToRoute, onDeviation, isDeviating]);

  const startSettingRoute = useCallback(() => {
    setIsSettingRoute(true);
    setTempWaypoints([]);
  }, []);

  const addWaypoint = useCallback((latitude: number, longitude: number) => {
    setTempWaypoints(prev => [...prev, { latitude, longitude }]);
  }, []);

  const addCurrentLocationAsWaypoint = useCallback(() => {
    if (currentLocation) {
      addWaypoint(currentLocation.latitude, currentLocation.longitude);
      toast.success('Waypoint added');
    }
  }, [currentLocation, addWaypoint]);

  const cancelSettingRoute = useCallback(() => {
    setIsSettingRoute(false);
    setTempWaypoints([]);
  }, []);

  const saveRoute = useCallback(async (name: string) => {
    if (tempWaypoints.length < 2) {
      toast.error('Add at least 2 waypoints to create a route');
      return;
    }

    const newRoute: SafeRoute = {
      id: crypto.randomUUID(),
      name,
      waypoints: tempWaypoints,
      isActive: false,
      createdAt: Date.now(),
    };

    await saveSafeRoute(newRoute);
    setRoutes(prev => [...prev, newRoute]);
    setIsSettingRoute(false);
    setTempWaypoints([]);
    toast.success('Safe route saved');
  }, [tempWaypoints]);

  const activateRoute = useCallback(async (routeId: string) => {
    // Deactivate all routes first
    for (const route of routes) {
      if (route.isActive) {
        await saveSafeRoute({ ...route, isActive: false });
      }
    }

    // Activate selected route
    const route = routes.find(r => r.id === routeId);
    if (route) {
      const updatedRoute = { ...route, isActive: true };
      await saveSafeRoute(updatedRoute);
      setActiveRoute(updatedRoute);
      setRoutes(prev => prev.map(r => 
        r.id === routeId ? updatedRoute : { ...r, isActive: false }
      ));
      toast.success(`Route "${route.name}" activated`);
    }
  }, [routes]);

  const deactivateRoute = useCallback(async () => {
    if (activeRoute) {
      await saveSafeRoute({ ...activeRoute, isActive: false });
      setActiveRoute(null);
      setRoutes(prev => prev.map(r => ({ ...r, isActive: false })));
      setIsDeviating(false);
      toast.info('Route deactivated');
    }
  }, [activeRoute]);

  const removeRoute = useCallback(async (routeId: string) => {
    await deleteSafeRoute(routeId);
    setRoutes(prev => prev.filter(r => r.id !== routeId));
    if (activeRoute?.id === routeId) {
      setActiveRoute(null);
      setIsDeviating(false);
    }
    toast.success('Route deleted');
  }, [activeRoute]);

  return {
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
    loadRoutes,
  };
}
