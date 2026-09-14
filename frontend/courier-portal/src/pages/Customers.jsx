import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, CircularProgress, Button,
} from '@mui/material';
import { getCustomers } from '../api/customerApi';
import CustomerRegisterDialog from '../components/CustomerRegisterDialog';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getCustomers()
      .then(setCustomers)
      .catch(() => setError('Could not load customers (is courier-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Customers</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>Register Customer</Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      {!loading && !error && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow><TableCell colSpan={3}>No customers registered yet.</TableCell></TableRow>
              ) : customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.fullName}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <CustomerRegisterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onRegistered={() => { setDialogOpen(false); load(); }}
      />
    </Box>
  );
}
