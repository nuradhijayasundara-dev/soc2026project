import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Grid, Alert,
} from '@mui/material';
import { requestBackhaulMatch } from '../api/matchingApi';

/**
 * The "shipment matching request form" — pre-filled from the shipment itself
 * (route + weight aren't editable here since they belong to the shipment
 * record; this just confirms what the Matching Engine will search on before
 * calling matching-service).
 */
export default function RequestBackhaulDialog({ open, onClose, shipment, onMatched }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const request = await requestBackhaulMatch(shipment.id);
      onMatched(request.id);
    } catch {
      setError('Could not request backhaul transport (is matching-service running?)');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shipment) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Request Backhaul Transport</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          The Matching Engine will search for trucks with a backhaul (return-leg) slot on this route.
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><b>Shipment:</b> {shipment.shipmentCode}</Grid>
          <Grid item xs={12} sm={6}><b>Weight:</b> {shipment.weightKg ?? '—'} kg</Grid>
          <Grid item xs={12} sm={6}><b>From:</b> {shipment.pickupLocation}</Grid>
          <Grid item xs={12} sm={6}><b>To:</b> {shipment.destination}</Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Searching…' : 'Find Trucks'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
