/**
 * Haversine formula to calculate the distance between two points on the earth in km.
 * Precision-tested and safely handles string/numeric inputs.
 */
export function calculateDistance(
  lat1: number | string | undefined | null,
  lon1: number | string | undefined | null,
  lat2: number | string | undefined | null,
  lon2: number | string | undefined | null
): number {
  const nLat1 = typeof lat1 === 'number' ? lat1 : parseFloat(String(lat1 ?? ''));
  const nLon1 = typeof lon1 === 'number' ? lon1 : parseFloat(String(lon1 ?? ''));
  const nLat2 = typeof lat2 === 'number' ? lat2 : parseFloat(String(lat2 ?? ''));
  const nLon2 = typeof lon2 === 'number' ? lon2 : parseFloat(String(lon2 ?? ''));

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = deg2rad(nLat2 - nLat1);
  const dLon = deg2rad(nLon2 - nLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(nLat1)) * Math.cos(deg2rad(nLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 100) / 100;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(distanceKm: number | undefined | null): string {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return '-- km';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export const POPULAR_LOCATIONS: { name: string; lat: number; lng: number }[] = [];
