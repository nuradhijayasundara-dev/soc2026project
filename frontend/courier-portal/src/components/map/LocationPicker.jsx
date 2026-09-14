import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import { defaultIcon, reverseGeocode } from '../../lib/geo';
import LocationSearch from './LocationSearch';

// SHARED component (both portals). Canonical copy: frontend/shared/map — edit there and
// re-sync to courier-portal/src/components/map and fleet-portal/src/components/map.

function FitCenter({ point }) {
  const map = useMap();
  useMemo(() => {
    if (point) map.panTo([point.lat, point.lng]);
  }, [point, map]);
  return null;
}

function ClickCatcher({ onPick }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const rev = await reverseGeocode(lat, lng);
        label = rev.label;
      } catch {
        // keep the raw coordinate label
      }
      onPick({ label, lat, lng, source: 'map-click' });
    },
  });
  return null;
}

/**
 * Search + map-click location picker. Always emits real OSM coordinates
 * (never a hardcoded city centroid) — the "pick on the map" flow from the
 * interface map. Selected shape: { label, lat, lng }.
 */
export default function LocationPicker({ label = 'Pick a location', value, onPick, height = 260 }) {
  const [mag, setMag] = useState([7.2906, 80.6337]);
  const [zoom, setZoom] = useState(7);

  const handleMapClick = (pick) => {
    onPick(pick);
  };

  const handleSearchSelect = (pick) => {
    onPick({ ...pick, source: 'search' });
  };

  return (
    <Box>
      <LocationSearch label={label} onSelect={handleSearchSelect} sx={{ mb: 1 }} />
      <Paper variant="outlined" sx={{ height, overflow: 'hidden' }}>
        <MapContainer
          center={mag}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={handleMapClick} />
          <FitCenter point={value} />
          {value && <Marker position={[value.lat, value.lng]} icon={defaultIcon()} />}
        </MapContainer>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {value
          ? value.label
          : 'Type to search, or click the map to drop the marker.'}
      </Typography>
    </Box>
  );
}