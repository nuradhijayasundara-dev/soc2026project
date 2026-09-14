import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Alert, Grid,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';

// Web counterpart of the Driver App's GpsService: pushes one location fix to
// gps-service (through the Gateway) so the Fleet Portal map shows this truck.
export default function SendLocation() {
  const [form, setForm] = useState({
    truckId: '', driverId: '', tripId: '', latitude: '', longitude: '',
    speedKmh: '', heading: '',
  });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({
        ...f,
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
        heading: pos.coords.heading != null ? pos.coords.heading.toFixed(1) : '',
        speedKmh: pos.coords.speed != null ? (pos.coords.speed * 3.6).toFixed(1) : '',
      })),
      () => setError('Could not read your location. Enable it or type coordinates.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setLoading(true);
    try {
      const payload = {
        truckId: Number(form.truckId) || null,
        driverId: form.driverId ? Number(form.driverId) : null,
        tripId: form.tripId ? Number(form.tripId) : null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        speedKmh: form.speedKmh ? Number(form.speedKmh) : null,
        heading: form.heading ? Number(form.heading) : null,
      };
      await apiClient.post('/gps/location', payload);
      setResult('Location ping sent to gps-service.');
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Only the truck driver can push this truck\'s location.'
        : `Ping failed (${err.response?.status || 'network error'}).`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Send Live Location"
        subtitle="Used to push a location fix for your truck (as the Driver App does automatically). The Fleet Portal map reads it via /gps/live."
      />

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {result && <Alert severity="success" sx={{ my: 2 }}>{result}</Alert>}

      <Paper sx={{ p: 3, maxWidth: 560 }} elevation={2}>
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField label="Truck ID *" type="number" fullWidth value={form.truckId} onChange={update('truckId')} required />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Driver ID" type="number" fullWidth value={form.driverId} onChange={update('driverId')} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Trip ID" type="number" fullWidth value={form.tripId} onChange={update('tripId')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Latitude *" type="number" fullWidth value={form.latitude} onChange={update('latitude')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Longitude *" type="number" fullWidth value={form.longitude} onChange={update('longitude')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Speed (km/h)" type="number" fullWidth value={form.speedKmh} onChange={update('speedKmh')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Heading (°)" type="number" fullWidth value={form.heading} onChange={update('heading')} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="button" variant="outlined" startIcon={<MyLocationIcon />} onClick={useMyLocation}>
              Use my location
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Sending…' : 'Send ping'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}