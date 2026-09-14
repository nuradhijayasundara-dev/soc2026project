import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import apiClient from '../apiClient';
import FleetGpsMap from '../components/map/FleetGpsMap';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';

const REFRESH_INTERVAL_MS = 10000; // poll every 10s; swap for WebSocket/SSE for true real-time

// "Live Monitoring" — platform-wide truck positions. GET /api/gps/live is
// already unscoped (every truck across every fleet company; see
// gps-service's GpsController), so this reads it directly — no changes to
// gps-service were needed, and the Admin Portal never touches its database
// (per "Do NOT access GPS database directly").
export default function LiveTracking() {
  const [locations, setLocations] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [live, trucksList, companiesList] = await Promise.all([
        apiClient.get('/gps/live').then((r) => r.data),
        apiClient.get('/fleet/admin/trucks').then((r) => r.data),
        apiClient.get('/fleet/admin/companies').then((r) => r.data),
      ]);
      setLocations(live);
      setTrucks(trucksList);
      setCompanies(companiesList);
      setError('');
    } catch {
      setError('Could not load live GPS data (is gps-service running?).');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const companyName = useMemo(() => {
    const map = new Map(companies.map((c) => [c.id, c.companyName]));
    return (id) => map.get(id) || `#${id}`;
  }, [companies]);

  return (
    <Box>
      <PageHeader
        title="Live Tracking"
        subtitle="Every truck currently transmitting GPS, across all fleet companies."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading live GPS data…" />}
      {!loading && (
        <>
          <FleetGpsMap locations={locations} trucks={trucks} getCompanyName={companyName} height={600} />
          {locations.length === 0 && !error && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No trucks are transmitting location right now — a truck shows up here once a driver
              starts a trip from the Driver App.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
