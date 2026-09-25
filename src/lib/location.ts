/**
 * Haversine formula to calculate the great-circle distance between two
 * points on Earth (in km). Handles string/numeric/null/undefined inputs.
 *
 * Valid ranges:  lat ∈ [-90, 90]   lng ∈ [-180, 180]
 * Returns 0 if any coordinate is invalid or out of range.
 */
export function calculateDistance(
  lat1: number | string | undefined | null,
  lon1: number | string | undefined | null,
  lat2: number | string | undefined | null,
  lon2: number | string | undefined | null
): number {
  const nLat1 = toNum(lat1);
  const nLon1 = toNum(lon1);
  const nLat2 = toNum(lat2);
  const nLon2 = toNum(lon2);

  // Reject NaN or out-of-range coordinates (catches swapped lat/lng, zeros, etc.)
  if (
    isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2) ||
    Math.abs(nLat1) > 90 || Math.abs(nLat2) > 90 ||
    Math.abs(nLon1) > 180 || Math.abs(nLon2) > 180 ||
    (nLat1 === 0 && nLon1 === 0) || (nLat2 === 0 && nLon2 === 0)
  ) {
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

  // Round to 2 decimal places (nearest 10m)
  return Math.round(d * 100) / 100;
}

function toNum(val: number | string | undefined | null): number {
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val ?? ''));
  return n;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(distanceKm: number | undefined | null): string {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm) || distanceKm === 0) {
    return '-- km';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export const POPULAR_LOCATIONS: { name: string; lat: number; lng: number }[] = [];
