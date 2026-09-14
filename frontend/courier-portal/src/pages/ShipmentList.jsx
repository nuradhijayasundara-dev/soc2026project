import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { getShipments } from '../api/shipmentApi';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function ShipmentList() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getShipments()
      .then(setShipments)
      .catch(() => setError('Could not load shipments (is courier-service running?)'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader
        title="Shipments"
        subtitle="Every shipment you've requested and its current state."
        action={() => navigate('/requests')}
        actionLabel="New Shipment Request"
        actionIcon={<AddIcon />}
      />

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading shipments…" />}

      {!loading && !error && shipments.length === 0 && (
        <EmptyState
          icon={<LocalShippingIcon fontSize="inherit" />}
          title="No shipments yet"
          message="Create your first backhaul shipment request to get started."
        />
      )}

      {!loading && !error && shipments.length > 0 && (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shipment ID</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipments.map((s) => (
                <TableRow
                  key={s.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{s.shipmentCode}</TableCell>
                  <TableCell>{s.pickupLocation}</TableCell>
                  <TableCell>{s.destination}</TableCell>
                  <TableCell><StatusChip status={s.status} /></TableCell>
                  <TableCell>{s.createdAt?.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}