import React, { useEffect, useMemo, useState } from 'react';
import { Box, Alert } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import DataTable from '../ui/DataTable';

// Read-only: observes fleet-service's data (GET /api/fleet/admin/drivers +
// /companies) — driver registration itself stays the fleet manager's own flow.
export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/fleet/admin/drivers'),
      apiClient.get('/fleet/admin/companies'),
    ])
      .then(([d, c]) => { setDrivers(d.data); setCompanies(c.data); })
      .catch(() => setError('Could not load drivers (is fleet-service running?).'))
      .finally(() => setLoading(false));
  }, []);

  const companyName = useMemo(() => {
    const map = new Map(companies.map((c) => [c.id, c.companyName]));
    return (id) => map.get(id) || `#${id}`;
  }, [companies]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'licenseNo', label: 'License No' },
    { key: 'fleetCompanyId', label: 'Fleet Company', render: (d) => companyName(d.fleetCompanyId) },
    { key: 'userId', label: 'Linked User ID', render: (d) => d.userId ?? '— (not claimed yet)' },
    { key: 'status', label: 'Status', render: (d) => <StatusChip status={d.status} /> },
  ];

  return (
    <Box>
      <PageHeader
        title="Drivers"
        subtitle="Every driver registered across all fleet companies."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading drivers…" />}
      {!loading && !error && drivers.length === 0 && (
        <EmptyState
          icon={<BadgeIcon fontSize="inherit" />}
          title="No drivers yet"
          message="Drivers appear here once a fleet manager registers one from the Fleet Portal."
        />
      )}
      {!loading && !error && drivers.length > 0 && (
        <DataTable columns={columns} rows={drivers} />
      )}
    </Box>
  );
}
