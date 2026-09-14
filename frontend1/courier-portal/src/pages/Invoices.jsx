import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Alert,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { getMyInvoices } from '../api/paymentApi';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyInvoices()
      .then(setInvoices)
      .catch(() => setError('Could not load invoices (is payment-service running?)'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader
        title="Invoices"
        subtitle="Costs for your matched backhaul bookings and their payment status."
      />

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading invoices…" />}

      {!loading && !error && invoices.length === 0 && (
        <EmptyState
          icon={<ReceiptLongIcon fontSize="inherit" />}
          title="No invoices yet"
          message="Invoices appear here once a fleet manager accepts one of your bookings."
        />
      )}

      {!loading && !error && invoices.length > 0 && (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice No.</TableCell>
                <TableCell>Shipment</TableCell>
                <TableCell>Truck</TableCell>
                <TableCell>Amount (LKR)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow
                  key={inv.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{inv.invoiceNo}</TableCell>
                  <TableCell>#{inv.shipmentId}</TableCell>
                  <TableCell>{inv.truckNo || '—'}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell><StatusChip status={inv.status} /></TableCell>
                  <TableCell>{inv.createdAt?.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}