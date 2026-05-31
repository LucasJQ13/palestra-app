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

export type NearestCommunitySearch = {
  nearestWithinRadius: NearestCommunityResult | null;
  nearestAnyDistance: NearestCommunityResult | null;
  communitiesWithCoordinates: number;
};

const EARTH_RADIUS_KM = 6371;
const MAX_RADIUS_KM = 5;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function normalizeCoordinate(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function validCoordinates(latitude: number | null, longitude: number | null) {
  return latitude != null
    && longitude != null
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && !(latitude === 0 && longitude === 0);
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

export function findNearestCommunityDetails(communities: AppCommunity[], userLocation: Coordinates, maxRadiusKm = MAX_RADIUS_KM): NearestCommunitySearch {
  const candidates: NearestCommunityResult[] = communities.flatMap((province) => province.locations
    .map<NearestCommunityResult | null>((community) => {
      const latitude = normalizeCoordinate(community.latitude);
      const longitude = normalizeCoordinate(community.longitude);
      if (!validCoordinates(latitude, longitude)) {
        return null;
      }
      const coordinates = { latitude, longitude } as Coordinates;
      const distanceKm = distanceInKm(userLocation, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
      return {
        province: province.province,
        community: { ...community, latitude: coordinates.latitude, longitude: coordinates.longitude },
        distanceKm,
        walkingMinutes: Math.max(1, Math.round((distanceKm / 4.8) * 60)),
        drivingMinutes: Math.max(1, Math.round((distanceKm / 28) * 60))
      };
    })
    .filter((item): item is NearestCommunityResult => item !== null))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestAnyDistance = candidates[0] ?? null;
  return {
    nearestWithinRadius: candidates.find((item) => item.distanceKm <= maxRadiusKm) ?? null,
    nearestAnyDistance,
    communitiesWithCoordinates: candidates.length
  };
}

export function findNearestCommunity(communities: AppCommunity[], userLocation: Coordinates, maxRadiusKm = MAX_RADIUS_KM): NearestCommunityResult | null {
  return findNearestCommunityDetails(communities, userLocation, maxRadiusKm).nearestWithinRadius;
}

export function googleMapsDirectionsUrl(from: Coordinates, to: Coordinates) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=walking`;
}
