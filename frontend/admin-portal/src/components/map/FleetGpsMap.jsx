import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { defaultIcon } from '../../lib/geo';

// Adapted from fleet-portal's src/components/map/FleetGpsMap.jsx for the
// Admin Portal's platform-wide "Live Tracking" page: fleet-portal's version
// shows only one fleet company's trucks; this one is handed every truck
// currently transmitting GPS across every fleet company (from
// GET /api/gps/live, which is already platform-wide — see gps-service's
// GpsController), so its popup also names which fleet company owns each
// truck via the optional `getCompanyName` lookup.

function FitAll({ bounds }) {
  const map = useMap();
  useMemo(() => {
    if (bounds.length === 1) map.setView(bounds[0], 8);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

// Fallback center (roughly central Sri Lanka) — re-centers on trucks when they report.
const DEFAULT_CENTER = [7.8731, 80.7718];

/**
 * Platform-wide GPS map: one marker per truck currently transmitting location,
 * across every fleet company.
 * `locations`: [{ truckId, latitude, longitude, speedKmh, updatedAt, ... }]
 * `trucks`: [{ id, truckNo, status, fleetCompanyId, ... }]
 * `getCompanyName(fleetCompanyId)`: optional — resolves a company name for the popup.
 */
export default function FleetGpsMap({ locations = [], trucks = [], getCompanyName, height = 600 }) {
  const marked = locations.map((loc) => ({
    ...loc,
    truck: trucks.find((t) => t.id === loc.truckId),
  }));

  const bounds = marked.map((m) => [m.latitude, m.longitude]);

  return (
    <Paper variant="outlined" sx={{ height, overflow: 'hidden' }}>
      <Box sx={{ height: '100%', width: '100%' }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitAll bounds={bounds} />
          {marked.map((m) => (
            <Marker
              key={m.truckId}
              position={[m.latitude, m.longitude]}
              icon={defaultIcon()}
            >
              <Tooltip direction="top" offset={[0, -30]}>
                {m.truck?.truckNo || `Truck #${m.truckId}`}
              </Tooltip>
              <Popup>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {m.truck?.truckNo || `Truck #${m.truckId}`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                    <Chip
                      size="small"
                      label={m.truck?.status || 'UNKNOWN'}
                      color={m.truck?.status === 'AVAILABLE' ? 'success' : 'info'}
                    />
                    <Typography variant="caption">
                      {(m.speedKmh ?? 0).toFixed(0)} km/h
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {m.truck?.fleetCompanyId
                      ? `Fleet: ${getCompanyName ? getCompanyName(m.truck.fleetCompanyId) : `#${m.truck.fleetCompanyId}`}`
                      : 'Fleet: —'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated: {m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString() : '—'}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}
