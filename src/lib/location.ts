/**
 * Haversine formula to calculate the distance between two points on the earth in km
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 100) / 100;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Popular college campus / landmark default coordinates (Bangalore/India default coordinates for rich demo)
export const POPULAR_LOCATIONS = [
  { name: 'Christ University Main Campus, Bangalore', lat: 12.9344, lng: 77.6060 },
  { name: 'IIT Madras Campus, Chennai', lat: 12.9915, lng: 80.2337 },
  { name: 'IIT Delhi Campus, Hauz Khas', lat: 28.5450, lng: 77.1926 },
  { name: 'PES University, Ring Road Campus', lat: 12.9343, lng: 77.5348 },
  { name: 'Koramanagala 5th Block, Bangalore', lat: 12.9352, lng: 77.6245 },
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
];
