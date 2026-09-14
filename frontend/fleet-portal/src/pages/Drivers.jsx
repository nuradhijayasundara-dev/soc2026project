import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Typography, Button,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { getDrivers } from '../api/driverApi';
import DriverRegisterDialog from '../components/DriverRegisterDialog';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getDrivers()
      .then(setDrivers)
      .catch(() => setError('Could not load drivers (is fleet-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <PageHeader
        title="Drivers"
        subtitle="Manage the drivers assigned to your fleet."
        action={() => setDialogOpen(true)}
        actionLabel="Register Driver"
        actionIcon={<AddIcon fontSize="small" />}
      />

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <LoadingState label="Loading drivers…" />}

      {!loading && !error && drivers.length === 0 && (
        <EmptyState
          icon={<PersonIcon fontSize="inherit" />}
          title="No drivers registered yet"
          message="Register your first driver to start assigning them to trips."
        />
      )}

      {!loading && !error && drivers.length > 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>License No.</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.fullName}</TableCell>
                  <TableCell>{d.phone}</TableCell>
                  <TableCell>{d.licenseNo}</TableCell>
                  <TableCell>
                    <StatusChip status={d.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <DriverRegisterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onRegistered={() => { setDialogOpen(false); load(); }}
      />
    </Box>
  );
}