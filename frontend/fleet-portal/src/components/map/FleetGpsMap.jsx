import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { defaultIcon } from '../../lib/geo';

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
 * Fleet GPS map: one marker per truck currently transmitting location.
 * `locations`: [{ truckId, truckNo, latitude, longitude, speedKmh, updatedAt, ... }]
 */
export default function FleetGpsMap({ locations = [], trucks = [], height = 600 }) {
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
                  <Typography variant="caption" color="text.secondary">
                    Driver: {m.truck?.driver ? `#${m.truck.driver}` : '—'} ·
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