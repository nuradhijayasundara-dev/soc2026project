// Geocoding + routing helpers for the map components. Nothing here hardcodes
// coordinates or route geometry — every value comes from a live API:
//   - Nominatim (OSM) for address search / reverse geocoding on map clicks.
//   - OSRM for route geometry (polylines) + driving distance/duration.
// Both are passed through the gateway-supported `map-overlay` role.
//
// SHARED lib (courier/fleet/admin portals). Canonical copy: frontend/shared/lib —
// edit there and re-sync to courier-portal/src/lib, fleet-portal/src/lib and
// admin-portal/src/lib. Admin Portal only needs defaultIcon() (Live Tracking's
// FleetGpsMap), but the rest is kept in sync verbatim rather than trimmed.

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OSRM_FALLBACK = 'https://router.project-osrm.org';

// The local OSRM instance backed by the Sri Lanka extract (docker-compose) is
// the preferred source when the browser can reach it; the public router is the
// fallback. Both return the same v5 response shape.
function osrmBase() {
  return import.meta.env.VITE_OSRM_BASE_URL || 'http://localhost:5000';
}

/** Nominatim "search" — free-text place/address search, Sri Lanka-first. */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&limit=8&q=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Geocoding search failed');
  const data = await res.json();
  return (data || []).map((p) => ({
    id: p.place_id,
    label: p.display_name,
    name: p.name || p.display_name,
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
  }));
}

/** Nominatim "reverse" — human label for a map-click coordinate. */
export async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const data = await res.json();
  return { label: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng };
}

/**
 * OSRM driving route between two coordinates. Returns
 *   { distanceKm, durationMin, geometry: [[lat,lng], ...] }
 * geometry is null when only distance/duration were requested.
 */
export async function getRoute(start, end, { overview = true } = {}) {
  if (!start?.lat || !end?.lat) return null;
  const url = `${osrmBase()}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}` +
    `?overview=${overview ? 'full' : 'false'}&geometries=geojson&alternatives=false`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Routing failed');
  const data = await res.json();
  const [route] = data.routes || [];
  if (!route) throw new Error('No route found');
  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    geometry:
      summaryRoute(route.geometry?.coordinates || null, start, end),
  };
}

/** OSRM with automatic fallback: local engine -> public router -> straight line. */
export async function getRouteSafe(start, end) {
  const attempts = [() => getRoute(start, end)];
  if (osrmBase() !== OSRM_FALLBACK) {
    attempts.push(() =>
      getRoute(start, end).catch(() => fetchPublicRoute(start, end))
    );
  }
  attempts.push(() => straightLineRoute(start, end));
  for (const attempt of attempts) {
    try {
      const route = await attempt();
      if (route) return route;
    } catch {
      // try the next fallback
    }
  }
  return null;
}

async function fetchPublicRoute(start, end) {
  const url = `${OSRM_FALLBACK}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}` +
    `?overview=full&geometries=geojson&alternatives=false`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Public routing failed');
  const data = await res.json();
  const [route] = data.routes || [];
  if (!route) throw new Error('No route found');
  const geometry = route.geometry?.coordinates?.length
    ? route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    : [[start.lat, start.lng], [end.lat, end.lng]];
  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    geometry,
  };
}

function summaryRoute(geometry, start, end) {
  if (geometry && geometry.length) {
    // GeoJSON coordinates are [lng, lat] — react-leaflet needs [lat, lng].
    return geometry.map(([lng, lat]) => [lat, lng]);
  }
  return [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ];
}

function straightLineRoute(start, end) {
  return {
    distanceKm: haversineKm(start, end),
    durationMin: Math.round((haversineKm(start, end) / 45) * 60),
    geometry: [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ],
  };
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Leaflet marker icon with explicit URLs (correct icons under bundlers). */
export function defaultIcon() {
  return window.L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

export function fmtKm(km) {
  if (km == null) return null;
  return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

export function fmtDur(min) {
  if (min == null) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${Math.round(min % 60)}m`;
}
