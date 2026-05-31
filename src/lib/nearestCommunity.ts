import { AppCommunity } from './remoteData';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type NearestCommunityResult = {
  province: string;
  community: AppCommunity['locations'][number];
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
};

const EARTH_RADIUS_KM = 6371;
const MAX_RADIUS_KM = 5;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInKm(from: Coordinates, to: Coordinates) {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCommunity(communities: AppCommunity[], userLocation: Coordinates, maxRadiusKm = MAX_RADIUS_KM): NearestCommunityResult | null {
  const candidates = communities.flatMap((province) => province.locations
    .filter((community) => community.latitude != null && community.longitude != null)
    .map((community) => {
      const distanceKm = distanceInKm(userLocation, {
        latitude: Number(community.latitude),
        longitude: Number(community.longitude)
      });
      return {
        province: province.province,
        community,
        distanceKm,
        walkingMinutes: Math.max(1, Math.round((distanceKm / 4.8) * 60)),
        drivingMinutes: Math.max(1, Math.round((distanceKm / 28) * 60))
      };
    }))
    .filter((item) => item.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return candidates[0] ?? null;
}

export function googleMapsDirectionsUrl(from: Coordinates, to: Coordinates) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=walking`;
}
