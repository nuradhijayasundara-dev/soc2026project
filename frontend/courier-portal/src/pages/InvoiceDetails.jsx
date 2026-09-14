import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, MenuItem, TextField,
  Alert, Divider,
} from '@mui/material';
import { getInvoice, getPaymentHistory, payInvoice } from '../api/paymentApi';
import StatusChip from '../ui/StatusChip';
import LoadingState from '../ui/LoadingState';

const METHODS = [
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
];

export default function InvoiceDetails() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState('CARD');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getInvoice(id), getPaymentHistory(id)])
      .then(([inv, hist]) => { setInvoice(inv); setPayments(hist); })
      .catch(() => setError('Could not load invoice'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      await payInvoice(id, method);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed — please try again');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingState label="Loading invoice…" />;
  if (error && !invoice) return <Alert severity="error">{error}</Alert>;
  if (!invoice) return null;

  return (
    <Box>
      <Button component={Link} to="/invoices" sx={{ mb: 2 }}>&larr; Back to Invoices</Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        Invoice {invoice.invoiceNo}
        <StatusChip sx={{ ml: 2 }} status={invoice.status} />
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Cost Breakdown</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><b>Shipment:</b> #{invoice.shipmentId}</Grid>
          <Grid item xs={12} sm={4}><b>Truck:</b> {invoice.truckNo || '—'}</Grid>
          <Grid item xs={12} sm={4}><b>Distance:</b> {invoice.distanceKm ? `${invoice.distanceKm.toFixed(1)} km` : '—'}</Grid>
          <Grid item xs={12} sm={4}><b>Weight:</b> {invoice.weightKg ?? '—'} kg</Grid>
          <Grid item xs={12} sm={4}><b>Created:</b> {invoice.createdAt?.slice(0, 10)}</Grid>
          <Grid item xs={12} sm={4}><b>Paid:</b> {invoice.paidAt ? invoice.paidAt.slice(0, 10) : '—'}</Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h4" fontWeight={700}>LKR {invoice.amount}</Typography>
      </Paper>

      {invoice.status === 'PENDING' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Make Payment</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField select label="Payment Method" value={method} sx={{ minWidth: 200 }}
              onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={handlePay} disabled={paying}>
              {paying ? 'Processing…' : `Pay LKR ${invoice.amount}`}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            This is a simulated payment for demo purposes — no real payment gateway is connected.
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Payment History</Typography>
        {payments.length === 0 ? (
          <Typography color="text.secondary">No payments yet.</Typography>
        ) : payments.map((p) => (
          <Box key={p.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
            <b>LKR {p.amount}</b> via {p.method} — {p.status} — ref {p.transactionRef} — {p.createdAt}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
