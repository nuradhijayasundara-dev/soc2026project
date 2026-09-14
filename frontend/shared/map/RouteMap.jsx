import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { getRouteSafe, defaultIcon, fmtKm, fmtDur } from '../../lib/geo';

// SHARED component (both portals). Canonical copy: frontend/shared/map — edit there and
// re-sync to courier-portal/src/components/map and fleet-portal/src/components/map.

/**
 * OSM/OSRM route map between two real coordinates.
 * Draws the driving route polyline (from the route engine — not hardcoded),
 * start/destination markers, and a distance/duration summary chip.
 */
export default function RouteMap({
  start,
  end,
  startLabel = 'Pickup',
  endLabel = 'Destination',
  height = 300,
  onRoute, // optional: (({ distanceKm, durationMin }) => void) — lets a parent (e.g. the
           // price estimate on Create Shipment) read the resolved route without refetching it.
}) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!start?.lat || !end?.lat) {
      setRoute(null);
      onRoute?.(null);
      return;
    }
    let alive = true;
    setLoading(true);
    getRouteSafe(start, end)
      .then((r) => {
        if (alive) {
          setRoute(r);
          onRoute?.(r ? { distanceKm: r.distanceKm, durationMin: r.durationMin } : null);
        }
      })
      .catch(() => alive && setRoute(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start?.lat, start?.lng, end?.lat, end?.lng]);

  const center = route?.geometry?.[0] || (start?.lat ? [start.lat, start.lng] : undefined);

  return (
    <Box>
      <Paper variant="outlined" sx={{ height, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <CircularProgress size={22} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1000, bgcolor: '#F0F7FD', borderRadius: 2 }} />
        )}
        {start?.lat && end?.lat && center ? (
          <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[start.lat, start.lng]} icon={defaultIcon()}>
              <Tooltip permanent direction="top">{startLabel}</Tooltip>
            </Marker>
            <Marker position={[end.lat, end.lng]} icon={defaultIcon()}>
              <Tooltip permanent direction="top">{endLabel}</Tooltip>
            </Marker>
            {route?.geometry && (
              <Polyline
                positions={route.geometry}
                pathOptions={{ color: '#1976d2', weight: 5, opacity: 0.85 }}
              />
            )}
          </MapContainer>
        ) : (
          <Typography sx={{ p: 2 }} color="text.secondary">
            Select both endpoints to see the route.
          </Typography>
        )}
      </Paper>
      {route && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          <b>{fmtKm(route.distanceKm)}</b> road &middot; ~{fmtDur(route.durationMin)} driving
        </Typography>
      )}
    </Box>
  );
}