import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Grid, TextField, MenuItem, Button, Alert } from '@mui/material';
import { getTrucks } from '../api/truckApi';
import { getDrivers } from '../api/driverApi';
import { createTrip } from '../api/tripApi';
import PageHeader from '../ui/PageHeader';

export default function TripCreate() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ truckId: '', driverId: '', shipmentId: '' });

  useEffect(() => {
    getTrucks().then((all) => setTrucks(all.filter((t) => t.status === 'AVAILABLE'))).catch(() => {});
    getDrivers(true).then(setDrivers).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const trip = await createTrip({
        truckId: form.truckId,
        driverId: form.driverId,
        shipmentId: form.shipmentId || null,
      });
      navigate('/trips', { state: { createdTripId: trip.id } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create trip — check truck/driver availability and shipment id');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Create Trip"
        subtitle="Assign an available truck and driver to a new trip."
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Truck" value={form.truckId} onChange={set('truckId')} required>
              {trucks.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.truckNo} — {t.capacityTon} ton</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Driver" value={form.driverId} onChange={set('driverId')} required>
              {drivers.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.fullName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Shipment ID (optional)" value={form.shipmentId}
              onChange={set('shipmentId')}
              helperText="Leave blank for a repositioning trip with no matched shipment"
            />
          </Grid>
        </Grid>

        <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Trip'}
        </Button>
      </Paper>
    </Box>
  );
}
