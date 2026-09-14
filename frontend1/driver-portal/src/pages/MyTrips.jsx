import React, { useEffect, useState } from 'react';
import {
  Box, List, ListItem, ListItemText, Paper, Button, Alert, Divider,
} from '@mui/material';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import apiClient from '../apiClient';
import StatusChip from '../ui/StatusChip';
import LoadingState from '../ui/LoadingState';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    apiClient.get('/fleet/trips/my')
      .then((r) => setTrips(r.data))
      .catch(() => setError('Could not load your trips.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startTrip = async (trip) => {
    setBusyId(trip.id);
    setError('');
    try {
      const { data } = await apiClient.patch(`/fleet/trips/${trip.id}/start`);
      setTrips((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } catch {
      setError('Could not start this trip.');
    } finally {
      setBusyId(null);
    }
  };

  const completeTrip = async (trip) => {
    setBusyId(trip.id);
    setError('');
    try {
      const { data } = await apiClient.patch(`/fleet/trips/${trip.id}/complete`);
      setTrips((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } catch {
      setError('Could not complete this trip.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState label="Loading your trips…" />;

  return (
    <Box>
      <PageHeader
        title="My Trips"
        subtitle="Your assigned trips and their current status."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {trips.length === 0 && !error && (
        <EmptyState
          icon={<AltRouteIcon fontSize="inherit" />}
          title="No trips yet"
          message="No trips are assigned to you yet. They will show up here once a match is confirmed."
        />
      )}

      {trips.length > 0 && (
        <Paper elevation={2}>
          <List dense>
            {trips.map((trip, i) => {
              const canStart = trip.status === 'SCHEDULED' || trip.status === 'PENDING_CONFIRMATION';
              const canComplete = trip.status === 'IN_PROGRESS';
              return (
                <Box key={trip.id}>
                  {i > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      canStart ? (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={busyId === trip.id}
                          onClick={() => startTrip(trip)}
                        >
                          Start trip
                        </Button>
                      ) : canComplete ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={busyId === trip.id}
                          onClick={() => completeTrip(trip)}
                        >
                          Complete delivery
                        </Button>
                      ) : null
                    }
                  >
                    <ListItemText
                      primary={
                        <>
                          Trip #{trip.id} — Shipment #{trip.shipmentId}
                          <StatusChip status={trip.status} sx={{ ml: 1, verticalAlign: 'middle' }} />
                        </>
                      }
                      secondary={
                        trip.startTime
                          ? `Started ${new Date(trip.startTime).toLocaleString()}`
                          : 'Not started yet'
                      }
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}