import React, { useEffect, useState } from 'react';
import { Grid, Box, Paper, Typography } from '@mui/material';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import LoadingState from '../ui/LoadingState';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PaidIcon from '@mui/icons-material/Paid';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { getFleetDashboardSummary } from '../api/truckApi';

export default function FleetDashboard() {
  const [summary, setSummary] = useState({
    trucksOnline: 0, availableCapacityTon: 0, todaysRevenue: 0, activeBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getFleetDashboardSummary()
      .then(setSummary)
      .catch(() => setError('Could not load dashboard summary (is fleet-service running?)'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader
        title="Fleet Dashboard"
        subtitle="An overview of your fleet, capacity and recent revenue."
      />

      {error && (
        <Paper
          sx={{ p: 2, mb: 2, bgcolor: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.4)' }}
        >
          <Typography color="error" sx={{ fontWeight: 600 }}>{error}</Typography>
        </Paper>
      )}
      {loading && <LoadingState label="Loading dashboard…" />}

      {!loading && !error && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalShippingIcon fontSize="small" />} accent="#FFB020"
              label="Trucks Online" value={summary.trucksOnline} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EventAvailableIcon fontSize="small" />} accent="#0284C7"
              label="Available Capacity (ton)" value={summary.availableCapacityTon} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PaidIcon fontSize="small" />} accent="#16A34A"
              label="Today's Revenue" value={summary.todaysRevenue} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#7C3AED"
              label="Active Bookings" value={summary.activeBookings} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}