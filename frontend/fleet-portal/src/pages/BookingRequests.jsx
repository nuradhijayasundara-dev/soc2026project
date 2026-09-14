import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { getPendingBookings, acceptBooking, rejectBooking } from '../api/bookingApi';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    getPendingBookings()
      .then(setBookings)
      .catch(() => setError('Could not load booking requests (is matching-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (id) => {
    setActingId(id);
    try {
      await acceptBooking(id);
      load();
    } catch {
      setError('Could not accept this booking');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    setActingId(id);
    try {
      await rejectBooking(id);
      load();
    } catch {
      setError('Could not reject this booking');
    } finally {
      setActingId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Booking Requests"
        subtitle="Backhaul bookings awaiting your accept or decline decision."
      />

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading booking requests…" />}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={<AssignmentTurnedInIcon fontSize="inherit" />}
          title="No pending booking requests"
          message="When a courier requests capacity on one of your posted routes, the request will appear here."
        />
      )}

      {!loading && !error && bookings.length > 0 && (
        <Grid container spacing={2}>
          {bookings.map((b) => (
            <Grid item xs={12} md={6} key={b.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Truck {b.truckNo}</Typography>
                  <StatusChip status="PENDING" label="Awaiting your decision" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {b.truckType || 'Truck type not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {b.routeFrom} → {b.routeTo}
                </Typography>
                <Typography variant="body2">Capacity: {b.availableCapacityTon} ton</Typography>
                {b.distanceKm != null && (
                  <Typography variant="body2" color="text.secondary">{b.distanceKm.toFixed(0)} km</Typography>
                )}
                <Typography variant="body2">Estimated: LKR {b.estimatedCost}</Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />}
                    disabled={actingId === b.id} onClick={() => handleAccept(b.id)}
                  >
                    Accept Booking
                  </Button>
                  <Button
                    fullWidth variant="outlined" color="error" startIcon={<CancelIcon />}
                    disabled={actingId === b.id} onClick={() => handleReject(b.id)}
                  >
                    Decline Booking
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}