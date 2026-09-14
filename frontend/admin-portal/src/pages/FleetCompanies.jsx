import React, { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import DataTable from '../ui/DataTable';

// Read-only: observes fleet-service's own data through
// GET /api/fleet/admin/companies — same 1:1 user<->company data-model note
// as CourierCompanies.jsx applies here too (no "branches" table exists).
export default function FleetCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/fleet/admin/companies')
      .then((r) => setCompanies(r.data))
      .catch(() => setError('Could not load fleet companies (is fleet-service running?).'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'registrationNo', label: 'Registration No' },
    { key: 'contactPhone', label: 'Contact Phone' },
    { key: 'address', label: 'Address' },
    { key: 'userId', label: 'Owner User ID' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Fleet Companies"
        subtitle="Every fleet company registered on the platform, read through fleet-service."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading fleet companies…" />}
      {!loading && !error && companies.length === 0 && (
        <EmptyState
          icon={<ApartmentIcon fontSize="inherit" />}
          title="No fleet companies yet"
          message="Companies appear here once a FLEET_MANAGER registers one from the Fleet Portal."
        />
      )}
      {!loading && !error && companies.length > 0 && (
        <DataTable columns={columns} rows={companies} />
      )}
    </Box>
  );
}
