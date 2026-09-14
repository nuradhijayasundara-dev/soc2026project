import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Typography, Button,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddIcon from '@mui/icons-material/Add';
import { getTrucks } from '../api/truckApi';
import TruckRegisterDialog from '../components/TruckRegisterDialog';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function TruckList() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getTrucks()
      .then(setTrucks)
      .catch(() => setError('Could not load trucks (is fleet-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <PageHeader
        title="Trucks"
        subtitle="Your fleet's trucks and their current availability."
        action={() => setDialogOpen(true)}
        actionLabel="Register Truck"
        actionIcon={<AddIcon fontSize="small" />}
      />

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <LoadingState label="Loading trucks…" />}

      {!loading && !error && trucks.length === 0 && (
        <EmptyState
          icon={<LocalShippingIcon fontSize="inherit" />}
          title="No trucks registered yet"
          message="Register your first truck so it can be posted as backhaul availability."
        />
      )}

      {!loading && !error && trucks.length > 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Truck No.</TableCell>
                <TableCell>Capacity (ton)</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trucks.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/trucks/${t.id}`)}
                >
                  <TableCell>{t.truckNo}</TableCell>
                  <TableCell>{t.capacityTon}</TableCell>
                  <TableCell>{t.truckType}</TableCell>
                  <TableCell>
                    <StatusChip status={t.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <TruckRegisterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onRegistered={() => { setDialogOpen(false); load(); }}
      />
    </Box>
  );
}