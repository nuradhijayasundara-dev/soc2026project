import React, { useEffect, useState } from 'react';
import { Grid, Box, Alert } from '@mui/material';
import { getDashboardSummary } from '../api/shipmentApi';
import StatCard from '../ui/StatCard';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Inventory2Icon from '@mui/icons-material/Inventory2';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalRequests: 0, matchedShipments: 0, inTransit: 0, delivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError('Could not load dashboard summary (is courier-service running?)'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your shipping activity."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading dashboard…" />}
      {!loading && !error && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#123B73"
              label="Total Requests" value={summary.totalRequests} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<SwapHorizIcon fontSize="small" />} accent="#0284C7"
              label="Matched Shipments" value={summary.matchedShipments} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalShippingIcon fontSize="small" />} accent="#FFB020"
              label="In Transit" value={summary.inTransit} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Inventory2Icon fontSize="small" />} accent="#16A34A"
              label="Delivered" value={summary.delivered} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}