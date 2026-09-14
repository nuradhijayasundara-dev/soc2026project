import React, { useEffect, useState } from 'react';
import { Box, Alert, Grid } from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import StatCard from '../ui/StatCard';
import DataTable from '../ui/DataTable';

// "Payment Management" — read-only over payment-service's own data
// (GET /api/payment/admin/invoices + /revenue-summary). The Admin Portal
// never touches payment_db directly and has no pay/refund action of its
// own — that business logic stays owned by InvoiceService, exactly as today.
export default function Payments() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/payment/admin/invoices'),
      apiClient.get('/payment/admin/revenue-summary'),
    ])
      .then(([inv, sum]) => { setInvoices(inv.data); setSummary(sum.data); })
      .catch(() => setError('Could not load payment data (is payment-service running?).'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'shipmentId', label: 'Shipment ID' },
    { key: 'courierUserId', label: 'Courier User ID' },
    { key: 'fleetCompanyId', label: 'Fleet Company ID' },
    { key: 'truckNo', label: 'Truck No' },
    { key: 'amount', label: 'Amount', render: (i) => `LKR ${Number(i.amount).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (i) => <StatusChip status={i.status} /> },
    { key: 'createdAt', label: 'Created', render: (i) => (i.createdAt ? new Date(i.createdAt).toLocaleString() : '—') },
    { key: 'paidAt', label: 'Paid At', render: (i) => (i.paidAt ? new Date(i.paidAt).toLocaleString() : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title="Payment Management"
        subtitle="Every invoice raised on the platform, across all fleet companies and couriers."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading payment data…" />}

      {!loading && !error && summary && (
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<PaymentsIcon fontSize="small" />} accent="#16A34A"
              label="Total Revenue" value={`LKR ${Number(summary.totalRevenue).toLocaleString()}`} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<PaymentsIcon fontSize="small" />} accent="#D97706"
              label="Pending Revenue" value={`LKR ${Number(summary.pendingRevenue).toLocaleString()}`} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<PaymentsIcon fontSize="small" />} accent="#0284C7"
              label="Paid Invoices" value={summary.paidInvoices} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<PaymentsIcon fontSize="small" />} accent="#DC2626"
              label="Failed Invoices" value={summary.failedInvoices} />
          </Grid>
        </Grid>
      )}

      {!loading && !error && invoices.length === 0 && (
        <EmptyState
          icon={<PaymentsIcon fontSize="inherit" />}
          title="No invoices yet"
          message="An invoice is created automatically the moment a fleet manager accepts a booking."
        />
      )}
      {!loading && !error && invoices.length > 0 && (
        <DataTable columns={columns} rows={invoices} />
      )}
    </Box>
  );
}
