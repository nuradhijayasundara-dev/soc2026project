import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { getLiveLocations } from '../api/gpsApi';
import { getTrucks } from '../api/truckApi';
import FleetGpsMap from '../components/map/FleetGpsMap';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';

const REFRESH_INTERVAL_MS = 10000; // poll every 10s; swap for WebSocket/SSE for true real-time

export default function GpsTracking() {
  const [locations, setLocations] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [live, trucksList] = await Promise.all([getLiveLocations(), getTrucks()]);
      setLocations(live);
      setTrucks(trucksList);
      setError('');
    } catch {
      setError('Could not load live GPS data (is gps-service running?)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <Box>
      <PageHeader
        title="GPS Tracking"
        subtitle="Live truck locations as reported by the Driver App."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading GPS data…" />}
      {!loading && (
        <>
          <FleetGpsMap locations={locations} trucks={trucks} height={600} />
          {locations.length === 0 && !error && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No trucks are transmitting location yet — start a trip from the Driver App to see it here.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}