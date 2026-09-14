import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, TextField, Table,
  TableHead, TableRow, TableCell, TableBody, Alert,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { getTruckById, getTruckAvailability, addTruckAvailability } from '../api/truckApi';
import StatusChip from '../ui/StatusChip';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function TruckDetails() {
  const { id } = useParams();
  const [truck, setTruck] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    routeFrom: '', routeTo: '', availableFrom: '', availableCapacityTon: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([getTruckById(id), getTruckAvailability(id)])
      .then(([t, a]) => { setTruck(t); setAvailability(a); })
      .catch(() => setError('Could not load truck (is fleet-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addTruckAvailability(id, {
        routeFrom: form.routeFrom,
        routeTo: form.routeTo,
        availableFrom: form.availableFrom,
        availableCapacityTon: form.availableCapacityTon,
      });
      setForm({ routeFrom: '', routeTo: '', availableFrom: '', availableCapacityTon: '' });
      load();
    } catch {
      setError('Could not add availability');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading truck…" />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!truck) return null;

  return (
    <Box>
      <Button component={Link} to="/trucks" sx={{ mb: 2 }}>&larr; Back to Trucks</Button>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          Truck {truck.truckNo}
        </Typography>
        <StatusChip status={truck.status} size="medium" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fleet asset details and posted backhaul availability.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><b>Capacity:</b> {truck.capacityTon} ton</Grid>
          <Grid item xs={12} sm={4}><b>Type:</b> {truck.truckType || '—'}</Grid>
          <Grid item xs={12} sm={4}><b>Status:</b> {truck.status}</Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }} component="form" onSubmit={handleAddAvailability}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Add Available Capacity</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Route From" value={form.routeFrom} onChange={set('routeFrom')} required />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Route To" value={form.routeTo} onChange={set('routeTo')} required />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth type="datetime-local" label="Available From"
              InputLabelProps={{ shrink: true }} value={form.availableFrom}
              onChange={set('availableFrom')} required />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth type="number" label="Capacity (ton)"
              value={form.availableCapacityTon} onChange={set('availableCapacityTon')} required />
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button fullWidth variant="contained" type="submit" disabled={submitting} sx={{ height: '100%' }}>
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Availability</Typography>
        {availability.length === 0 ? (
          <Box sx={{ mt: 1 }}>
            <EmptyState
              icon={<EventAvailableIcon fontSize="inherit" />}
              title="No availability posted yet"
              message="Add availability above so couriers can request capacity on this truck."
            />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Route</TableCell>
                <TableCell>Available From</TableCell>
                <TableCell>Capacity (ton)</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availability.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.routeFrom} → {a.routeTo}</TableCell>
                  <TableCell>{a.availableFrom}</TableCell>
                  <TableCell>{a.availableCapacityTon}</TableCell>
                  <TableCell>
                    <StatusChip status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}