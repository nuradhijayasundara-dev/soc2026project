import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Grid, CircularProgress, Alert, Divider, LinearProgress,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { getMatchRequest, getMatchResults, acceptMatch, retryMatch } from '../api/matchingApi';
import RouteMap from '../components/map/RouteMap';
import StatusChip from '../ui/StatusChip';
import LoadingState from '../ui/LoadingState';

// How often to silently re-check while a request is WAITING_FOR_MATCH — the
// backend also retries this request on its own schedule (see matching-service's
// retryWaitingRequests sweep + the MATCH_FOUND notification it fires), this
// polling just refreshes the screen without the courier needing to reload.
const WAITING_POLL_MS = 20000;

const statusLabel = {
  RECOMMENDED: null,
  PENDING_CONFIRMATION: 'Awaiting fleet confirmation',
  ACCEPTED: 'Booking confirmed',
  REJECTED: 'Declined',
};

const FACETS = [
  { key: 'routeScore', label: 'Route', color: 'primary' },
  { key: 'capacityScore', label: 'Capacity', color: 'success' },
  { key: 'proximityScore', label: 'Proximity', color: 'info' },
  { key: 'timeScore', label: 'Timing', color: 'warning' },
  { key: 'vehicleScore', label: 'Vehicle', color: 'secondary' },
];

export default function MatchResults() {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([getMatchRequest(requestId), getMatchResults(requestId)])
      .then(([req, res]) => { setRequest(req); setResults(res); })
      .catch(() => { if (!silent) setError('Could not load match results (is matching-service running?)'); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [requestId]);

  // Silently re-check while waiting — a fleet manager posting a new backhaul
  // route elsewhere should surface here without the courier refreshing.
  useEffect(() => {
    if (request?.status !== 'WAITING_FOR_MATCH') return;
    const timer = setInterval(() => load(true), WAITING_POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.status]);

  const handleCheckAgain = async () => {
    setRetrying(true);
    try {
      await retryMatch(requestId);
      load();
    } catch {
      setError('Could not check for new matches right now');
    } finally {
      setRetrying(false);
    }
  };

  const handleAcceptMatch = async (resultId) => {
    setAcceptingId(resultId);
    try {
      await acceptMatch(resultId);
      load();
    } catch {
      setError('Could not accept this match');
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <LoadingState label="Loading match results…" />;

  const shipmentRoute = {
    start:
      request?.pickupLat != null
        ? { lat: request.pickupLat, lng: request.pickupLng || 0 }
        : null,
    end:
      request?.destinationLat != null
        ? { lat: request.destinationLat, lng: request.destinationLng || 0 }
        : null,
  };

  return (
    <Box>
      <Button component={Link} to={`/shipments/${request?.shipmentId || ''}`} sx={{ mb: 2 }}>
        &larr; Back to Shipment
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>Match Results</Typography>

      {request && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><b>From:</b> {request.pickupLocation}</Grid>
            <Grid item xs={12} sm={4}><b>To:</b> {request.destination}</Grid>
            <Grid item xs={12} sm={4}><b>Weight:</b> {request.weightKg} kg</Grid>
          </Grid>
          {shipmentRoute.start && shipmentRoute.end && (
            <Box sx={{ mt: 2 }}>
              <RouteMap
                start={shipmentRoute.start}
                end={shipmentRoute.end}
                startLabel="Pickup"
                endLabel="Destination"
                height={180}
              />
            </Box>
          )}
        </Paper>
      )}

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {results.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <HourglassTopIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Status: WAITING_FOR_MATCH
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No backhaul truck fits this route right now — this isn't final. We keep checking
            automatically as fleet managers post new availability, and you'll be notified the
            moment a suitable vehicle turns up.
          </Typography>
          <Button variant="outlined" onClick={handleCheckAgain} disabled={retrying}>
            {retrying ? 'Checking…' : 'Check Again Now'}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {results.map((r) => (
            <Grid item xs={12} md={6} lg={4} key={r.id}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalShippingIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>{r.truckNo}</Typography>
                  {statusLabel[r.status] && (
                    <StatusChip status={r.status} label={statusLabel[r.status]} sx={{ ml: 'auto' }} />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {r.truckType || 'Truck type not specified'} · {r.routeFrom} → {r.routeTo}
                </Typography>
                <Typography variant="body2">Capacity: {r.availableCapacityTon} ton</Typography>
                {r.distanceKm != null && (
                  <Typography variant="body2" color="text.secondary">
                    {r.distanceKm.toFixed(0)} km off-route
                  </Typography>
                )}

                {(r.routeFromLat != null && r.routeToLat != null) && (
                  <Box sx={{ mt: 1 }}>
                    <RouteMap
                      start={{ lat: r.routeFromLat, lng: r.routeFromLng }}
                      end={{ lat: r.routeToLat, lng: r.routeToLng }}
                      startLabel="Truck start"
                      endLabel="Truck route end"
                      height={150}
                    />
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="h6">LKR {r.estimatedCost}</Typography>
                  <Typography variant="body1" fontWeight={700} color="primary">
                    {(r.matchScore ?? 0).toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Estimated cost · match score
                </Typography>

                <Box sx={{ mt: 1, mb: 2 }}>
                  {FACETS.map((f) => (
                    <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography variant="caption" sx={{ width: 70 }}>{f.label}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={r[f.key] ?? 0}
                        color={f.color}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ width: 32, textAlign: 'right' }}>
                        {Math.round(r[f.key] ?? 0)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Button
                  variant="contained" sx={{ mt: 'auto' }} fullWidth
                  disabled={r.status !== 'RECOMMENDED' || acceptingId === r.id}
                  onClick={() => handleAcceptMatch(r.id)}
                >
                  {r.status === 'RECOMMENDED'
                    ? (acceptingId === r.id ? 'Accepting…' : 'Accept Match')
                    : statusLabel[r.status]}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}