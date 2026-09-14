import React, { useEffect, useState } from 'react';
import { Box, Alert, Tabs, Tab, Grid } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import StatCard from '../ui/StatCard';
import DataTable from '../ui/DataTable';

// "Matching Monitoring" — observes matching-service's raw data through
// GET /api/matching/admin/{requests,results,stats}. Read-only: the actual
// accept/reject business logic stays owned by MatchingService, exactly as
// today — this page only watches it happen.
export default function Matching() {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/matching/admin/requests'),
      apiClient.get('/matching/admin/results'),
      apiClient.get('/matching/admin/stats'),
    ])
      .then(([req, res, st]) => { setRequests(req.data); setResults(res.data); setStats(st.data); })
      .catch(() => setError('Could not load matching data (is matching-service running?).'))
      .finally(() => setLoading(false));
  }, []);

  const requestColumns = [
    { key: 'id', label: 'ID' },
    { key: 'shipmentId', label: 'Shipment ID' },
    { key: 'requestedByUserId', label: 'Requested By (User ID)' },
    { key: 'pickupLocation', label: 'Pickup' },
    { key: 'destination', label: 'Destination' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { key: 'createdAt', label: 'Created', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—') },
  ];

  const resultColumns = [
    { key: 'id', label: 'ID' },
    { key: 'matchRequestId', label: 'Request ID' },
    { key: 'truckNo', label: 'Truck No' },
    { key: 'fleetCompanyId', label: 'Fleet Company ID' },
    { key: 'matchScore', label: 'Score', render: (r) => (r.matchScore != null ? r.matchScore.toFixed(1) : '—') },
    { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { key: 'createdAt', label: 'Created', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title="Matching Monitoring"
        subtitle="Every match request and candidate result the matching engine has produced."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading matching data…" />}

      {!loading && !error && stats && (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<SwapHorizIcon fontSize="small" />} accent="#0284C7" label="Total Requests" value={stats.totalRequests} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<SwapHorizIcon fontSize="small" />} accent="#2563EB" label="Recommended" value={stats.resultsByStatus?.RECOMMENDED ?? 0} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<SwapHorizIcon fontSize="small" />} accent="#EA580C" label="Pending Confirmation" value={stats.resultsByStatus?.PENDING_CONFIRMATION ?? 0} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<SwapHorizIcon fontSize="small" />} accent="#16A34A" label="Accepted" value={stats.resultsByStatus?.ACCEPTED ?? 0} />
          </Grid>
        </Grid>
      )}

      {!loading && !error && (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab value="requests" label={`Requests (${requests.length})`} />
            <Tab value="results" label={`Results (${results.length})`} />
          </Tabs>

          {tab === 'requests' && (
            requests.length === 0 ? (
              <EmptyState icon={<SwapHorizIcon fontSize="inherit" />} title="No match requests yet" />
            ) : (
              <DataTable columns={requestColumns} rows={requests} />
            )
          )}

          {tab === 'results' && (
            results.length === 0 ? (
              <EmptyState icon={<SwapHorizIcon fontSize="inherit" />} title="No match results yet" />
            ) : (
              <DataTable columns={resultColumns} rows={results} />
            )
          )}
        </>
      )}
    </Box>
  );
}
