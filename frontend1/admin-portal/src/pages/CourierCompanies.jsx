import React, { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import DataTable from '../ui/DataTable';

// Read-only: the Admin Portal observes courier-service's own data through
// GET /api/courier/admin/companies — it doesn't own or edit this data itself
// (registration/updates stay the courier company's own "My Company" flow).
//
// NOTE on scope: the platform's data model links each CourierCompany to
// exactly one auth user (a 1:1 companyName <-> userId), with no separate
// "branches" or "multiple company users" table. The spec's "company users"
// concept isn't represented here for that reason, rather than showing
// fabricated data for it.
export default function CourierCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/courier/admin/companies')
      .then((r) => setCompanies(r.data))
      .catch(() => setError('Could not load courier companies (is courier-service running?).'))
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
        title="Courier Companies"
        subtitle="Every courier company registered on the platform, read through courier-service."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading courier companies…" />}
      {!loading && !error && companies.length === 0 && (
        <EmptyState
          icon={<BusinessIcon fontSize="inherit" />}
          title="No courier companies yet"
          message="Companies appear here once a COURIER_USER registers one from the Courier Portal."
        />
      )}
      {!loading && !error && companies.length > 0 && (
        <DataTable columns={columns} rows={companies} />
      )}
    </Box>
  );
}
