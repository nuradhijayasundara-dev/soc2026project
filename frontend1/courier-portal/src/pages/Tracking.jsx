import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Stepper, Step,
  StepLabel, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { getShipments, getShipmentTracking } from '../api/shipmentApi';
import { getLiveGps } from '../api/gpsApi';
import RouteMap from '../components/map/RouteMap';
import LiveTrackingMap from '../components/map/LiveTrackingMap';
import StatusChip from '../ui/StatusChip';
import LoadingState from '../ui/LoadingState';
import PageHeader from '../ui/PageHeader';

const STATUS_FLOW = ['PENDING', 'MATCHED', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_LABELS = {
  PENDING: 'Request Placed', MATCHED: 'Matched', IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered',
};

export default function Tracking() {
  const [code, setCode] = useState('');
  const [shipment, setShipment] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [liveTrucks, setLiveTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const loadLive = () => {
    getLiveGps().then(setLiveTrucks).catch(() => setLiveTrucks([]));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const all = await getShipments();
      const match = all.find((s) => s.shipmentCode.toLowerCase() === code.trim().toLowerCase());
      if (!match) {
        setShipment(null);
        setError(`No shipment found with code "${code}"`);
        return;
      }
      const history = await getShipmentTracking(match.id);
      setShipment(match);
      setTracking(history);
      if (match.status === 'IN_TRANSIT') loadLive();
    } catch {
      setError('Could not search shipments (is courier-service running?)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shipment || shipment.status !== 'IN_TRANSIT') return;
    const timer = setInterval(loadLive, 10000);
    return () => clearInterval(timer);
  }, [shipment]);

  const currentStepIndex = shipment ? STATUS_FLOW.indexOf(shipment.status) : -1;

  const plannedRoute =
    shipment?.pickupLat != null && shipment?.destinationLat != null
      ? [
          [shipment.pickupLat, shipment.pickupLng || 0],
          [shipment.destinationLat, shipment.destinationLng || 0],
        ]
      : null;

  const livePin = liveTrucks[0] || null;

  return (
    <Box>
      <PageHeader title="Shipment Tracking" subtitle="Track a shipment by code and watch live GPS for in-transit loads." />

      <Paper sx={{ p: 3, mb: 3 }} component="form" onSubmit={handleSearch}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth label="Shipment ID" placeholder="SHP-0001"
            value={code} onChange={(e) => setCode(e.target.value)} required
          />
          <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled={loading}>
            Track
          </Button>
        </Box>
      </Paper>

      {loading && <LoadingState label="Searching shipments…" />}
      {!loading && error && <Alert severity="warning">{error}</Alert>}

      {!loading && shipment && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Shipment {shipment.shipmentCode}</Typography>
              <StatusChip status={shipment.status} />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><b>From:</b> {shipment.pickupLocation}</Grid>
              <Grid item xs={12} sm={6}><b>To:</b> {shipment.destination}</Grid>
              <Grid item xs={12} sm={6}><b>Weight:</b> {shipment.weightKg ?? '—'} kg</Grid>
              <Grid item xs={12} sm={6}><b>Est. Delivery:</b> {shipment.deliveryDeadline || '—'}</Grid>
              {shipment.distanceKm != null && (
                <Grid item xs={12} sm={6}>
                  <b>Road distance:</b> {shipment.distanceKm.toFixed(1)} km
                </Grid>
              )}
              {shipment.estimatedDurationMin != null && (
                <Grid item xs={12} sm={6}>
                  <b>Est. duration:</b> {Math.round(shipment.estimatedDurationMin)} min
                </Grid>
              )}
            </Grid>
          </Paper>

          {shipment.status !== 'CANCELLED' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stepper activeStep={currentStepIndex} alternativeLabel>
                {STATUS_FLOW.map((s) => <Step key={s}><StepLabel>{STATUS_LABELS[s]}</StepLabel></Step>)}
              </Stepper>
            </Paper>
          )}

          {plannedRoute && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Route map</Typography>
              <RouteMap
                start={{ lat: shipment.pickupLat, lng: shipment.pickupLng || 0 }}
                end={{ lat: shipment.destinationLat, lng: shipment.destinationLng || 0 }}
                startLabel="Pickup"
                endLabel="Destination"
                height={280}
              />
            </Paper>
          )}

          {shipment.status === 'IN_TRANSIT' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Live GPS</Typography>
              <LiveTrackingMap plannedRoute={plannedRoute} live={livePin} height={300} />
              <Typography variant="caption" color="text.secondary">
                {liveTrucks.length
                  ? `Showing truck #${livePin.truckId} — ${liveTrucks.length} truck(s) reporting live positions.`
                  : 'No driver is reporting GPS yet — the driver app uploads position when a trip starts.'}
              </Typography>
            </Paper>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tracking History</Typography>
            {tracking.length === 0 ? (
              <Typography color="text.secondary">No tracking events yet.</Typography>
            ) : (
              tracking.map((t) => (
                <Box key={t.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                  <b>{t.status}</b> — {t.location || 'unknown location'} — {t.updatedAt}
                </Box>
              ))
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}