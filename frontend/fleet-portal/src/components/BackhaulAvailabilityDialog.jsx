import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Grid, MenuItem, Alert,
} from '@mui/material';
import { getTrucks } from '../api/truckApi';
import { postBackhaulAvailability } from '../api/availabilityApi';
import LocationPicker from '../components/map/LocationPicker';
import RouteMap from '../components/map/RouteMap';

/**
 * "Add truck availability for backhaul, available capacity, and return destination":
 * fleet manager picks which truck just finished an outbound delivery, then
 * marks its current position and the return destination ON A REAL MAP — the
 * picker emits actual OSM coordinates (never a hardcoded city point), which
 * flow into the QuickAvailabilityRequest so the Matching Engine can score this
 * truck's real lane against shipment routes.
 */
export default function BackhaulAvailabilityDialog({ open, onClose, onPosted }) {
  const [trucks, setTrucks] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    truckId: '', routeFrom: null, returnDestination: null, availableFrom: '', availableCapacityTon: '',
  });

  useEffect(() => {
    if (open) getTrucks().then(setTrucks).catch(() => {});
  }, [open]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await postBackhaulAvailability({
        truckId: form.truckId,
        routeFrom: form.routeFrom?.label?.split(',')[0] || form.routeFrom?.label || '',
        routeFromLat: form.routeFrom?.lat,
        routeFromLng: form.routeFrom?.lng,
        returnDestination: form.returnDestination?.label?.split(',')[0] || form.returnDestination?.label || '',
        routeToLat: form.returnDestination?.lat,
        routeToLng: form.returnDestination?.lng,
        availableFrom: form.availableFrom,
        availableCapacityTon: form.availableCapacityTon,
      });
      setForm({ truckId: '', routeFrom: null, returnDestination: null, availableFrom: '', availableCapacityTon: '' });
      onPosted();
    } catch {
      setError('Could not post backhaul availability');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Post Backhaul Availability</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Truck" value={form.truckId} onChange={setField('truckId')} required>
                {trucks.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.truckNo} — {t.capacityTon} ton</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="datetime-local" label="Available From"
                InputLabelProps={{ shrink: true }} value={form.availableFrom}
                onChange={setField('availableFrom')} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Available Capacity (ton)"
                value={form.availableCapacityTon} onChange={setField('availableCapacityTon')} required />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocationPicker
                label="Current location (truck)"
                value={form.routeFrom}
                onPick={(p) => setForm((f) => ({ ...f, routeFrom: p }))}
                height={220}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocationPicker
                label="Return destination"
                value={form.returnDestination}
                onPick={(p) => setForm((f) => ({ ...f, returnDestination: p }))}
                height={220}
              />
            </Grid>

            {form.routeFrom?.lat && form.returnDestination?.lat && (
              <Grid item xs={12}>
                <RouteMap start={form.routeFrom} end={form.returnDestination} height={180} />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Availability'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}