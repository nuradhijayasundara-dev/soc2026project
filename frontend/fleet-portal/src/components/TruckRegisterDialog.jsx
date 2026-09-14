import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, Alert,
} from '@mui/material';
import { addTruck } from '../api/truckApi';

export default function TruckRegisterDialog({ open, onClose, onRegistered }) {
  const [form, setForm] = useState({ truckNo: '', capacityTon: '', truckType: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addTruck(form);
      setForm({ truckNo: '', capacityTon: '', truckType: '' });
      onRegistered();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register truck (truck number may already exist)');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register Truck</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Truck No." placeholder="WP-AB-1234"
                value={form.truckNo} onChange={set('truckNo')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Capacity (ton)"
                value={form.capacityTon} onChange={set('capacityTon')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Truck Type" placeholder="Box Truck"
                value={form.truckType} onChange={set('truckType')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Registering…' : 'Register'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
