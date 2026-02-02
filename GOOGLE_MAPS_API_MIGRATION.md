# Google Maps API Migration Guide

## Overview

This document outlines the migration from the deprecated `google.maps.Marker` to the modern `google.maps.marker.AdvancedMarkerElement` API, as recommended by Google as of February 21, 2024.

**Reference**: https://developers.google.com/maps/deprecations

## What Changed

### Deprecation Notice
- **Deprecated**: `google.maps.Marker` (deprecated Feb 21, 2024)
- **Recommended**: `google.maps.marker.AdvancedMarkerElement`
- **Support Status**: Google Maps will continue bug fixes for major regressions, but existing bugs won't be addressed
- **Sunset Notice**: At least 12 months notice will be given before `google.maps.Marker` support is discontinued

### Why Migrate
- **Future-proof**: AdvancedMarkerElement is the recommended API going forward
- **Better Performance**: Improved rendering and customization options
- **Modern Features**: Better support for custom content and styling
- **No Legacy Debt**: Avoid future breaking changes when Marker is sunset

## Files Updated

### 1. `src/components/LocationMap.tsx`
**Purpose**: Displays current location with a single marker on the map

**Key Changes**:
- Removed `Marker` import from `@react-google-maps/api`
- Added `useEffect` and `useRef` hooks for marker management
- Created marker DOM element manually using `document.createElement()`
- Marker is now managed via `google.maps.marker.AdvancedMarkerElement` constructor
- Added `mapId: 'safe-location-map'` to map options (required for AdvancedMarkerElement)

**Before**:
```typescript
import { Marker } from '@react-google-maps/api';

<GoogleMap ...>
  {currentLocation && (
    <Marker
      position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#f472b6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }}
    />
  )}
</GoogleMap>
```

**After**:
```typescript
const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

useEffect(() => {
  if (map && currentLocation) {
    if (!markerRef.current) {
      const markerDiv = document.createElement('div');
      markerDiv.className = 'w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-lg';
      
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
        map: map,
        content: markerDiv,
      });
    } else {
      markerRef.current.position = { lat: currentLocation.latitude, lng: currentLocation.longitude };
    }
  }
}, [map, currentLocation]);
```

### 2. `src/components/SafeRouteMap.tsx`
**Purpose**: Displays safe routes with waypoints and polyline path

**Key Changes**:
- Removed `Marker` import from `@react-google-maps/api`
- Added state for map instance and markers array reference
- Created separate useEffect to manage all markers (current location + waypoints)
- Each marker is now an `AdvancedMarkerElement` with custom DOM content
- Added proper cleanup in `onUnmount` callback
- Added `mapId: 'safe-route-map'` to map options

**Before**:
```typescript
<GoogleMap ...>
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
  {path.length >= 2 && <Polyline ... />}
</GoogleMap>
```

**After**:
```typescript
const [map, setMap] = useState<google.maps.Map | null>(null);
const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

useEffect(() => {
  if (!map) return;
  
  // Clean up old markers
  markersRef.current.forEach(marker => marker.map = null);
  markersRef.current = [];
  
  // Add current location marker
  if (currentLocation) {
    const currentMarkerDiv = document.createElement('div');
    currentMarkerDiv.className = 'w-4 h-4 rounded-full bg-pink-500 ...';
    markersRef.current.push(
      new google.maps.marker.AdvancedMarkerElement({ ... })
    );
  }
  
  // Add waypoint markers
  waypoints.forEach((wp, idx) => {
    const waypointDiv = document.createElement('div');
    // styling with text content...
    markersRef.current.push(
      new google.maps.marker.AdvancedMarkerElement({ ... })
    );
  });
}, [map, currentLocation, waypoints]);

<GoogleMap onLoad={setMap} onUnmount={() => { ... }}>
  {path.length >= 2 && <Polyline ... />}
</GoogleMap>
```

## Technical Details

### AdvancedMarkerElement Constructor
```typescript
new google.maps.marker.AdvancedMarkerElement({
  position: { lat: number, lng: number },  // Required: marker position
  map: google.maps.Map,                     // Required: map instance
  content: HTMLElement,                     // Optional: custom DOM content
  title: string,                            // Optional: hover tooltip
})
```

### Key Differences

| Aspect | Marker | AdvancedMarkerElement |
|--------|--------|----------------------|
| API Status | Deprecated (Feb 21, 2024) | Recommended ✓ |
| Icon Customization | Via `icon` prop | Via `content` (DOM) |
| Performance | Legacy | Optimized |
| Lifecycle | Component-based | Direct API |
| Browser Support | Older browsers | Modern browsers |
| Future Support | Sunset planned | Long-term support |

### Browser Compatibility
- AdvancedMarkerElement requires modern browsers with full ES2020 support
- Works on all modern versions of Chrome, Firefox, Safari, and Edge
- Mobile browsers (Chrome Mobile, Safari iOS) fully supported

### Map ID Requirement
AdvancedMarkerElement requires a `mapId` in the map options:
```typescript
const mapOptions = {
  mapId: 'my-unique-map-id',  // Required for AdvancedMarkerElement
  // ... other options
}
```

## Styling Markers

### Custom Content Styling
Markers now use DOM elements, so styling is done with:

**CSS Classes**:
```typescript
const markerDiv = document.createElement('div');
markerDiv.className = 'w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-lg';
```

**Inline Styles**:
```typescript
waypointDiv.style.fontSize = '12px';
waypointDiv.style.fontWeight = '600';
waypointDiv.style.color = 'white';
```

**HTML Content**:
```typescript
waypointDiv.textContent = String(idx + 1);  // Number label
```

## Memory Management

### Cleanup
Always remove markers when they're no longer needed:
```typescript
// In cleanup/onUnmount
marker.map = null;  // Removes marker from map
markerRef.current = null;  // Clear reference
```

### Best Practice
```typescript
useEffect(() => {
  // Cleanup old markers
  markersRef.current.forEach(marker => {
    marker.map = null;
  });
  markersRef.current = [];
  
  // Create new markers
  // ...
}, [map, data]);
```

## Testing

### What to Test
- ✅ Markers appear at correct locations
- ✅ Markers are clickable and interactive
- ✅ Marker updates when location changes
- ✅ Waypoint numbering displays correctly
- ✅ Polylines render correctly over markers
- ✅ No console errors or warnings

### Manual Testing
1. Open the app in browser console
2. Navigate to Location panel → markers should appear
3. Navigate to Safe Routes → multiple markers should appear with numbers
4. Verify markers update as location changes

## Migration Checklist

- [x] Remove `Marker` imports from components
- [x] Add `useEffect` and `useRef` hooks
- [x] Create DOM elements for marker content
- [x] Initialize `AdvancedMarkerElement` instances
- [x] Add `mapId` to map options
- [x] Implement proper cleanup logic
- [x] Test marker rendering
- [x] Verify no TypeScript errors
- [x] Verify build completes
- [x] Test in dev server

## References

- **Official Migration Guide**: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration
- **AdvancedMarkerElement Docs**: https://developers.google.com/maps/documentation/javascript/reference/marker#AdvancedMarkerElement
- **Deprecation Notice**: https://developers.google.com/maps/deprecations

## Timeline

- **February 21, 2024**: google.maps.Marker deprecated
- **Current**: Using AdvancedMarkerElement (recommended)
- **Future**: Marker support will be phased out (12+ months notice)

## Questions & Troubleshooting

### "AdvancedMarkerElement is not defined"
- Ensure `mapId` is set in GoogleMap options
- Verify Google Maps API is loaded

### "Marker doesn't appear on map"
- Check that `map` instance is available
- Verify position coordinates are valid
- Ensure map is loaded before creating marker

### "Styling doesn't match old markers"
- AdvancedMarkerElement uses DOM styling, not the old icon system
- Use Tailwind classes or inline styles for custom appearance
- Test with different CSS properties

## Future Improvements

- Consider implementing marker clustering for many waypoints
- Add custom marker animations
- Implement marker click handlers for interactivity
- Consider caching marker DOM elements for performance

---

**Migration Completed**: February 2, 2026
**Verification**: ✅ Build Success | ✅ No TypeScript Errors | ✅ Dev Server Running
