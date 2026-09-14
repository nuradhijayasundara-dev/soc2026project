import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import apiClient from '../api/apiClient';

const StatCard = ({ label, value }) => (
  <Paper sx={{ p: 2 }} elevation={2}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight={700}>{value}</Typography>
  </Paper>
);

/**
 * "Platform Reports": total matches, successful bookings, total capacity
 * utilized — platform-wide, so matching-service's backend restricts this to
 * ADMIN accounts (checked via the "X-User-Role" header the Gateway already
 * forwards). There's no dedicated Admin Portal in this project yet, so this
 * page lives here as a demo/reference view — register an account with role
 * ADMIN to see it render instead of the 403 message below.
 */
export default function PlatformReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/matching/reports/platform-summary')
      .then((r) => setSummary(r.data))
      .catch((err) => {
        setError(err.response?.status === 403
          ? 'Platform reports are restricted to ADMIN accounts.'
          : 'Could not load platform reports (is matching-service running?)');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="warning">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Platform Reports</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total Matches" value={summary.totalMatches} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Successful Bookings" value={summary.successfulBookings} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total Capacity Utilized" value={`${summary.totalCapacityUtilizedTon} ton`} />
        </Grid>
      </Grid>
    </Box>
  );
}
