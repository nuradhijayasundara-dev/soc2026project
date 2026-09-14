import React, { useEffect, useMemo, useState } from 'react';
import { Box, Alert } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import DataTable from '../ui/DataTable';

// Read-only: observes fleet-service's data (GET /api/fleet/admin/trucks +
// /companies) — the fleet company itself still owns truck registration via
// its own "Add Truck" flow in the Fleet Portal.
export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/fleet/admin/trucks'),
      apiClient.get('/fleet/admin/companies'),
    ])
      .then(([t, c]) => { setTrucks(t.data); setCompanies(c.data); })
      .catch(() => setError('Could not load trucks (is fleet-service running?).'))
      .finally(() => setLoading(false));
  }, []);

  const companyName = useMemo(() => {
    const map = new Map(companies.map((c) => [c.id, c.companyName]));
    return (id) => map.get(id) || `#${id}`;
  }, [companies]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'truckNo', label: 'Truck No' },
    { key: 'fleetCompanyId', label: 'Fleet Company', render: (t) => companyName(t.fleetCompanyId) },
    { key: 'capacityTon', label: 'Capacity (ton)' },
    { key: 'truckType', label: 'Type' },
    { key: 'status', label: 'Status', render: (t) => <StatusChip status={t.status} /> },
  ];

  return (
    <Box>
      <PageHeader
        title="Trucks"
        subtitle="Every truck registered across all fleet companies."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading trucks…" />}
      {!loading && !error && trucks.length === 0 && (
        <EmptyState
          icon={<LocalShippingIcon fontSize="inherit" />}
          title="No trucks yet"
          message="Trucks appear here once a fleet manager registers one from the Fleet Portal."
        />
      )}
      {!loading && !error && trucks.length > 0 && (
        <DataTable columns={columns} rows={trucks} />
      )}
    </Box>
  );
}
