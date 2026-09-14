import React, { useEffect, useMemo, useState } from 'react';
import { Box, Alert, Grid } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import StatCard from '../ui/StatCard';
import DataTable from '../ui/DataTable';

// "Booking Management" — a booking IS a MatchResult once a courier has
// accepted it (status moves past RECOMMENDED). This page reuses
// matching-service's admin API rather than inventing a separate "bookings"
// concept the backend doesn't have — see MatchResult.Status in
// matching-service for why PENDING_CONFIRMATION/ACCEPTED/REJECTED are the
// three states that represent an actual booking, and CapacityReservation for
// the capacity that was set aside for it.
const BOOKING_STATUSES = ['PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED'];

export default function Bookings() {
  const [results, setResults] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/matching/admin/results'),
      apiClient.get('/matching/admin/reservations'),
      apiClient.get('/matching/admin/stats'),
    ])
      .then(([res, rsv, st]) => { setResults(res.data); setReservations(rsv.data); setStats(st.data); })
      .catch(() => setError('Could not load bookings (is matching-service running?).'))
      .finally(() => setLoading(false));
  }, []);

  const bookings = useMemo(
    () => results.filter((r) => BOOKING_STATUSES.includes(r.status)),
    [results]
  );

  const reservationStatus = useMemo(() => {
    const map = new Map(reservations.map((r) => [r.matchResultId, r.status]));
    return (matchResultId) => map.get(matchResultId);
  }, [reservations]);

  const columns = [
    { key: 'id', label: 'Booking (Result) ID' },
    { key: 'matchRequestId', label: 'Match Request ID' },
    { key: 'truckNo', label: 'Truck No' },
    { key: 'fleetCompanyId', label: 'Fleet Company ID' },
    { key: 'estimatedCost', label: 'Estimated Cost', render: (r) => (r.estimatedCost != null ? r.estimatedCost : '—') },
    { key: 'status', label: 'Booking Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'reservation',
      label: 'Capacity Reservation',
      render: (r) => {
        const st = reservationStatus(r.id);
        return st ? <StatusChip status={st} /> : '—';
      },
    },
    { key: 'createdAt', label: 'Created', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title="Booking Management"
        subtitle="Every match result that has moved past a recommendation into an actual booking flow."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading bookings…" />}

      {!loading && !error && stats && (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#EA580C"
              label="Pending Confirmation" value={stats.resultsByStatus?.PENDING_CONFIRMATION ?? 0} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#16A34A"
              label="Accepted" value={stats.resultsByStatus?.ACCEPTED ?? 0} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#DC2626"
              label="Rejected" value={stats.resultsByStatus?.REJECTED ?? 0} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#7C3AED"
              label="Capacity Reservations" value={stats.totalReservations} />
          </Grid>
        </Grid>
      )}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={<AssignmentTurnedInIcon fontSize="inherit" />}
          title="No bookings yet"
          message="Bookings appear here once a courier accepts a recommended match."
        />
      )}
      {!loading && !error && bookings.length > 0 && (
        <DataTable columns={columns} rows={bookings} />
      )}
    </Box>
  );
}
