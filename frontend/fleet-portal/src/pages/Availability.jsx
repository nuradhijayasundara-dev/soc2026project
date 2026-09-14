import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { getMyAvailability } from '../api/availabilityApi';
import BackhaulAvailabilityDialog from '../components/BackhaulAvailabilityDialog';
import RouteMap from '../components/map/RouteMap';
import StatusChip from '../ui/StatusChip';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

const tripTypeColor = { BACKHAUL: 'secondary', OUTBOUND: 'default' };

export default function Availability() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getMyAvailability()
      .then(setRows)
      .catch(() => setError('Could not load availability (is fleet-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <PageHeader
        title="Truck Availability"
        subtitle="Backhaul capacity your fleet has posted along its routes."
        action={() => setDialogOpen(true)}
        actionLabel="Post Backhaul Availability"
        actionIcon={<EventAvailableIcon fontSize="small" />}
      />

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <LoadingState label="Loading availability…" />}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon={<EventAvailableIcon fontSize="inherit" />}
          title="No availability posted yet"
          message="Post a backhaul route to let matched couriers request capacity on your trucks."
        />
      )}

      {!loading && !error && rows.length > 0 && (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Truck ID</TableCell>
                <TableCell>From</TableCell>
                <TableCell>Return Destination</TableCell>
                <TableCell>Available From</TableCell>
                <TableCell>Capacity (ton)</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Route</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>#{a.truckId}</TableCell>
                  <TableCell>{a.routeFrom}{a.routeFromLat != null && <Typography variant="caption" display="block" color="text.secondary">{a.routeFromLat.toFixed(4)}, {a.routeFromLng?.toFixed(4)}</Typography>}</TableCell>
                  <TableCell>{a.routeTo}{a.routeToLat != null && <Typography variant="caption" display="block" color="text.secondary">{a.routeToLat.toFixed(4)}, {a.routeToLng?.toFixed(4)}</Typography>}</TableCell>
                  <TableCell>{a.availableFrom}</TableCell>
                  <TableCell>{a.availableCapacityTon}</TableCell>
                  <TableCell>
                    <Chip label={a.tripType} size="small" color={tripTypeColor[a.tripType] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={a.status} />
                  </TableCell>
                  <TableCell sx={{ minWidth: 240 }}>
                    {a.routeFromLat != null && a.routeToLat != null ? (
                      <RouteMap
                        start={{ lat: a.routeFromLat, lng: a.routeFromLng }}
                        end={{ lat: a.routeToLat, lng: a.routeToLng }}
                        height={110}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No coords (Places lookup)</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <BackhaulAvailabilityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onPosted={() => { setDialogOpen(false); load(); }}
      />
    </Box>
  );
}