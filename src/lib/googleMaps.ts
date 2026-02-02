import type { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_LOADER_ID = 'google-map-script';
export const GOOGLE_MAPS_VERSION = 'weekly' as const;
export const GOOGLE_MAPS_LANGUAGE = 'en';
export const GOOGLE_MAPS_REGION = 'US';

// Keep this identical everywhere we load Google Maps to avoid Loader option mismatch errors.
// 'marker' library is required for AdvancedMarkerElement (recommended API as of Feb 2024)
export const GOOGLE_MAPS_LIBRARIES: Libraries = ['marker'];

export function getGoogleMapsLoaderOptions(apiKey: string) {
  return {
    googleMapsApiKey: apiKey,
    id: GOOGLE_MAPS_LOADER_ID,
    version: GOOGLE_MAPS_VERSION,
    language: GOOGLE_MAPS_LANGUAGE,
    region: GOOGLE_MAPS_REGION,
    libraries: GOOGLE_MAPS_LIBRARIES,
  };
}
