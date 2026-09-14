import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, Alert, Typography,
} from '@mui/material';
import { registerCompany } from '../api/companyApi';

/**
 * Courier-company onboarding. A courier operator must register their company
 * before the Dashboard, customers and shipments work — every /courier/**
 * endpoint returns 404 until then. This dialog is opened automatically by the
 * Layout when the company check finds none, and stays open until it is set up.
 */
export default function CompanySetupDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ companyName: '', registrationNo: '', contactPhone: '', address: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const saved = await registerCompany(form);
      setForm({
        companyName: saved.companyName || '',
        registrationNo: saved.registrationNo || '',
        contactPhone: saved.contactPhone || '',
        address: saved.address || '',
      });
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not set up your company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Set up your courier company</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You need a courier company profile before creating shipments, registering
            customers or viewing your dashboard.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Company Name" value={form.companyName}
                onChange={set('companyName')} required autoFocus />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Registration No." value={form.registrationNo}
                onChange={set('registrationNo')} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Contact Phone" value={form.contactPhone}
                onChange={set('contactPhone')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" value={form.address} onChange={set('address')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Company'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}