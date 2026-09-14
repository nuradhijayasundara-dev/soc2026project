import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import { defaultIcon, haversineKm, fmtKm } from '../../lib/geo';

// SHARED component (both portals). Canonical copy: frontend/shared/map — edit there and
// re-sync to courier-portal/src/components/map and fleet-portal/src/components/map.

function FitBounds({ bounds }) {
  const map = useMap();
  useMemo(() => {
    if (bounds && bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

/**
 * Live GPS tracking map. Shows the truck's planned route (dashed), its live
 * position along the way, and a radius bubble around the supplied GPS point.
 * `live` entries may use { lat, lng } or { latitude, longitude }.
 */
export default function LiveTrackingMap({ plannedRoute, live, height = 320 }) {
  const [gps, setGps] = useState(null);

  useEffect(() => {
    if (!live || !live.lat && !live.latitude) return;
    setGps({ lat: live.lat ?? live.latitude, lng: live.lng ?? live.longitude });
  }, [live?.lat, live?.lng, live?.latitude, live?.longitude]);

  const { bounds, distanceLabel } = useMemo(() => {
    const pts = [];
    if (plannedRoute?.length) pts.push(...plannedRoute);
    if (gps) pts.push([gps.lat, gps.lng]);
    return { bounds: pts, distanceLabel: plannedRoute?.length ? fmtKm(haversineKm(plannedRoute[0], plannedRoute[plannedRoute.length - 1])) : null };
  }, [plannedRoute, gps]);

  return (
    <Box>
      <Paper variant="outlined" sx={{ height, overflow: 'hidden' }}>
        <MapContainer center={bounds[0] || [7.2906, 80.6337]} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />
          {plannedRoute?.length > 0 && (
            <Polyline
              positions={plannedRoute}
              pathOptions={{ color: '#1976d2', weight: 4, opacity: 0.6, dashArray: '8 8' }}
            />
          )}
          {gps && (
            <>
              <CircleMarker
                center={[gps.lat, gps.lng]}
                radius={22}
                pathOptions={{ color: '#e15554', fillColor: '#e15554', fillOpacity: 0.15 }}
              />
              <Marker position={[gps.lat, gps.lng]} icon={defaultIcon()}>
                <Tooltip permanent direction="top">Truck now</Tooltip>
              </Marker>
            </>
          )}
          {plannedRoute?.length > 0 && (
            <Marker position={plannedRoute[0]} icon={defaultIcon()}>
              <Tooltip permanent direction="top">Start</Tooltip>
            </Marker>
          )}
          {plannedRoute?.length > 0 && (
            <Marker position={plannedRoute[plannedRoute.length - 1]} icon={defaultIcon()}>
              <Tooltip permanent direction="top">End</Tooltip>
            </Marker>
          )}
        </MapContainer>
      </Paper>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {gps
          ? `Live position: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}${plannedRoute?.length ? ` · route span ${distanceLabel}` : ''}`
          : plannedRoute?.length
            ? 'Waiting for the driver app to report GPS…'
            : 'No live GPS point yet.'}
      </Typography>
    </Box>
  );
}