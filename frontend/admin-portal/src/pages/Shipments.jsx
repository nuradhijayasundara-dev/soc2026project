import React, { useEffect, useState } from 'react';
import { Box, Alert, Select, MenuItem, Paper } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import DataTable from '../ui/DataTable';

const STATUSES = ['PENDING', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

// Read-only: observes courier-service's data through
// GET /api/courier/admin/shipments (optionally filtered by ?status=).
export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = status === 'ALL' ? {} : { status };
    apiClient.get('/courier/admin/shipments', { params })
      .then((r) => setShipments(r.data))
      .catch(() => setError('Could not load shipments (is courier-service running?).'))
      .finally(() => setLoading(false));
  }, [status]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'shipmentCode', label: 'Code' },
    { key: 'pickupLocation', label: 'Pickup' },
    { key: 'destination', label: 'Destination' },
    { key: 'weightKg', label: 'Weight (kg)' },
    { key: 'requiredVehicleType', label: 'Vehicle Type' },
    { key: 'status', label: 'Status', render: (s) => <StatusChip status={s.status} /> },
    {
      key: 'createdAt',
      label: 'Created',
      render: (s) => (s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Shipments"
        subtitle="Every shipment created on the platform, across all courier companies."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5 }}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="ALL">All statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </Paper>

      {loading && <LoadingState label="Loading shipments…" />}
      {!loading && !error && shipments.length === 0 && (
        <EmptyState
          icon={<Inventory2Icon fontSize="inherit" />}
          title="No shipments"
          message="No shipments match this filter yet."
        />
      )}
      {!loading && !error && shipments.length > 0 && (
        <DataTable columns={columns} rows={shipments} />
      )}
    </Box>
  );
}
