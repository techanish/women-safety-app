// Offline database of emergency places (police stations, hospitals, etc.)
// This is a comprehensive India-focused database

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'pharmacy' | 'fire_station' | 'women_helpline';
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  available24x7?: boolean;
  city: string;
  state: string;
}

// Sample data - In production, this would be a larger dataset
export const EMERGENCY_PLACES: NearbyPlace[] = [
  // Bangalore
  {
    id: '1',
    name: 'Bangalore City Police Headquarters',
    type: 'police',
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Infantry Road, Bengaluru',
    phone: '100',
    available24x7: true,
    city: 'Bangalore',
    state: 'Karnataka',
  },
  {
    id: '2',
    name: 'Victoria Hospital',
    type: 'hospital',
    latitude: 12.9698,
    longitude: 77.5977,
    address: 'Fort, Bengaluru',
    phone: '080-26700301',
    available24x7: true,
    city: 'Bangalore',
    state: 'Karnataka',
  },
  {
    id: '3',
    name: 'Women & Child Helpline',
    type: 'women_helpline',
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Bangalore',
    phone: '1091',
    available24x7: true,
    city: 'Bangalore',
    state: 'Karnataka',
  },
  // Delhi
  {
    id: '4',
    name: 'Delhi Police Headquarters',
    type: 'police',
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Jai Singh Road, New Delhi',
    phone: '100',
    available24x7: true,
    city: 'Delhi',
    state: 'Delhi',
  },
  {
    id: '5',
    name: 'AIIMS Delhi',
    type: 'hospital',
    latitude: 28.5672,
    longitude: 77.2100,
    address: 'Ansari Nagar, New Delhi',
    phone: '011-26588500',
    available24x7: true,
    city: 'Delhi',
    state: 'Delhi',
  },
  {
    id: '6',
    name: 'Delhi Women Helpline',
    type: 'women_helpline',
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Delhi',
    phone: '181',
    available24x7: true,
    city: 'Delhi',
    state: 'Delhi',
  },
  // Mumbai
  {
    id: '7',
    name: 'Mumbai Police Commissioner Office',
    type: 'police',
    latitude: 18.9388,
    longitude: 72.8353,
    address: 'Crawford Market, Mumbai',
    phone: '100',
    available24x7: true,
    city: 'Mumbai',
    state: 'Maharashtra',
  },
  {
    id: '8',
    name: 'Lilavati Hospital',
    type: 'hospital',
    latitude: 19.0544,
    longitude: 72.8317,
    address: 'Bandra West, Mumbai',
    phone: '022-26567891',
    available24x7: true,
    city: 'Mumbai',
    state: 'Maharashtra',
  },
  {
    id: '9',
    name: 'Maharashtra Women Helpline',
    type: 'women_helpline',
    latitude: 18.9388,
    longitude: 72.8353,
    address: 'Mumbai',
    phone: '103',
    available24x7: true,
    city: 'Mumbai',
    state: 'Maharashtra',
  },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearbyPlaces(
  latitude: number,
  longitude: number,
  type?: NearbyPlace['type'],
  maxDistance: number = 10 // km
): Array<NearbyPlace & { distance: number }> {
  let places = EMERGENCY_PLACES;

  // Filter by type if specified
  if (type) {
    places = places.filter((p) => p.type === type);
  }

  // Calculate distances and sort
  return places
    .map((place) => ({
      ...place,
      distance: calculateDistance(latitude, longitude, place.latitude, place.longitude),
    }))
    .filter((place) => place.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

export function getEmergencyNumbers(latitude?: number, longitude?: number) {
  // Determine region based on coordinates (simplified - in production use proper geocoding)
  const isDelhi = latitude && Math.abs(latitude - 28.6139) < 1 && Math.abs(longitude! - 77.2090) < 1;
  const isMumbai = latitude && Math.abs(latitude - 18.9388) < 1 && Math.abs(longitude! - 72.8353) < 1;

  return {
    police: [
      { name: 'Emergency Police', number: '100' },
      { name: 'National Emergency', number: '112' },
    ],
    ambulance: [
      { name: 'Emergency Ambulance', number: '108' },
      { name: 'National Emergency', number: '112' },
    ],
    helpline: [
      { name: 'Women Helpline', number: '1091' },
      { name: 'Women Helpline (Short)', number: '181' },
      { name: 'Child Helpline', number: '1098' },
    ],
  };
}

// Add a custom place to local storage
export function addCustomPlace(place: Omit<NearbyPlace, 'id'>): void {
  const customPlaces = getCustomPlaces();
  const newPlace: NearbyPlace = {
    ...place,
    id: `custom-${Date.now()}`,
  };
  customPlaces.push(newPlace);
  localStorage.setItem('custom_emergency_places', JSON.stringify(customPlaces));
}

export function getCustomPlaces(): NearbyPlace[] {
  const stored = localStorage.getItem('custom_emergency_places');
  return stored ? JSON.parse(stored) : [];
}

export function removeCustomPlace(id: string): void {
  const customPlaces = getCustomPlaces();
  const updated = customPlaces.filter((p) => p.id !== id);
  localStorage.setItem('custom_emergency_places', JSON.stringify(updated));
}
