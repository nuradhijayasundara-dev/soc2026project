import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Button, MenuItem, TextField, Alert,
} from '@mui/material';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import AddIcon from '@mui/icons-material/Add';
import { getTrips, assignDriver } from '../api/tripApi';
import { getDrivers } from '../api/driverApi';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

export default function DriverAssignment() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState({}); // tripId -> driverId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getTrips(), getDrivers(true)])
      .then(([t, d]) => { setTrips(t); setDrivers(d); })
      .catch(() => setError('Could not load trips (is fleet-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReassign = async (tripId) => {
    const driverId = selectedDriver[tripId];
    if (!driverId) return;
    try {
      await assignDriver(tripId, driverId);
      load();
    } catch {
      setError('Could not reassign driver — trip may have already started');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Trips &amp; Driver Assignment"
        subtitle="Schedule truck trips and reassign drivers while trips are pending."
        action={() => navigate('/trips/new')}
        actionLabel="Create Trip"
        actionIcon={<AddIcon fontSize="small" />}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading trips…" />}

      {!loading && !error && trips.length === 0 && (
        <EmptyState
          icon={<AltRouteIcon fontSize="inherit" />}
          title="No trips yet"
          message="Create your first trip to start matching drivers and trucks."
        />
      )}

      {!loading && !error && trips.length > 0 && (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Trip ID</TableCell>
                <TableCell>Truck ID</TableCell>
                <TableCell>Driver ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reassign Driver</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>#{t.id}</TableCell>
                  <TableCell>{t.truckId}</TableCell>
                  <TableCell>{t.driverId ?? <em>Unassigned</em>}</TableCell>
                  <TableCell>
                    <StatusChip status={t.status} />
                  </TableCell>
                  <TableCell>
                    {t.status === 'SCHEDULED' ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          select size="small" sx={{ minWidth: 140 }}
                          value={selectedDriver[t.id] || ''}
                          onChange={(e) => setSelectedDriver((s) => ({ ...s, [t.id]: e.target.value }))}
                        >
                          {drivers.map((d) => (
                            <MenuItem key={d.id} value={d.id}>{d.fullName}</MenuItem>
                          ))}
                        </TextField>
                        <Button size="small" variant="outlined" onClick={() => handleReassign(t.id)}>
                          Assign
                        </Button>
                      </Box>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}