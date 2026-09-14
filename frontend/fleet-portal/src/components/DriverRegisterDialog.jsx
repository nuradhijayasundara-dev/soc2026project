import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, Alert,
} from '@mui/material';
import { registerDriver } from '../api/driverApi';

export default function DriverRegisterDialog({ open, onClose, onRegistered }) {
  const [form, setForm] = useState({ fullName: '', phone: '', licenseNo: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerDriver(form);
      setForm({ fullName: '', phone: '', licenseNo: '' });
      onRegistered();
    } catch {
      setError('Could not register driver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register Driver</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Name" value={form.fullName}
                onChange={set('fullName')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="License No." value={form.licenseNo} onChange={set('licenseNo')} />
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
