import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Alert,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { getMyBookingInvoices, getRevenueSummary } from '../api/revenueApi';
import StatusChip from '../ui/StatusChip';
import StatCard from '../ui/StatCard';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function RevenueDashboard() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getRevenueSummary(), getMyBookingInvoices()])
      .then(([s, inv]) => { setSummary(s); setInvoices(inv); })
      .catch(() => setError('Could not load revenue data (is payment-service running?)'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader
        title="Revenue"
        subtitle="Invoices earned by your fleet and their payment status."
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading revenue…" />}

      {!loading && !error && summary && (
        <>
          {/* Fleet revenue display — summary cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AssignmentTurnedInIcon fontSize="small" />} accent="#123B73"
                label="Total Bookings" value={summary.totalBookings} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<PaidIcon fontSize="small" />} accent="#16A34A"
                label="Paid" value={summary.paidBookings} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<ReceiptLongIcon fontSize="small" />} accent="#FFB020"
                label="Total Revenue" value={`LKR ${summary.totalRevenue}`} sub="from paid invoices" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<EventAvailableIcon fontSize="small" />} accent="#D97706"
                label="Pending Revenue" value={`LKR ${summary.pendingRevenue}`} sub={`${summary.pendingBookings} unpaid`} />
            </Grid>
          </Grid>

          {/* Booking revenue dashboard — every invoice earned by this company */}
          {invoices.length === 0 ? (
            <EmptyState
              icon={<ReceiptLongIcon fontSize="inherit" />}
              title="No bookings invoiced yet"
              message="Invoices appear here once a booking has been generated."
            />
          ) : (
            <Paper sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice No.</TableCell>
                    <TableCell>Shipment</TableCell>
                    <TableCell>Truck</TableCell>
                    <TableCell>Distance</TableCell>
                    <TableCell>Amount (LKR)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.invoiceNo}</TableCell>
                      <TableCell>#{inv.shipmentId}</TableCell>
                      <TableCell>{inv.truckNo || '—'}</TableCell>
                      <TableCell>{inv.distanceKm ? `${inv.distanceKm.toFixed(1)} km` : '—'}</TableCell>
                      <TableCell>{inv.amount}</TableCell>
                      <TableCell>
                        <StatusChip status={inv.status} />
                      </TableCell>
                      <TableCell>{inv.createdAt?.slice(0, 10)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}