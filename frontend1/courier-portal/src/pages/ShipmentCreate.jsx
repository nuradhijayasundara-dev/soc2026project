import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, Alert, Divider,
  CircularProgress,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import { createShipment } from '../api/shipmentApi';
import { getCustomers } from '../api/customerApi';
import { getPriceEstimate } from '../api/paymentApi';
import LocationPicker from '../components/map/LocationPicker';
import RouteMap from '../components/map/RouteMap';

const PARCEL_TYPES = ['Documents', 'General Cargo', 'Fragile', 'Perishable'];
const VEHICLE_TYPES = ['Box Truck', 'Lorry', 'Light Truck', 'Container Truck'];
const PRIORITIES = ['STANDARD', 'EXPRESS', 'URGENT'];
const PRICE_DEBOUNCE_MS = 500;

export default function ShipmentCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    newCustomerName: '',
    newCustomerPhone: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    pickup: null, // { label, lat, lng }
    pickupDatetime: '',
    destination: null, // { label, lat, lng }
    requiredVehicleType: 'Box Truck',
    deliveryDeadline: '',
    weightKg: '',
    dimensions: '',
    parcelType: 'Documents',
    priority: 'STANDARD',
    remarks: '',
  });

  const [routeInfo, setRouteInfo] = useState(null); // { distanceKm, durationMin } from RouteMap
  const [estimate, setEstimate] = useState(null);   // PriceEstimateResponse from payment-service
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => {});
  }, []);

  // Price Estimation (spec section 2): re-quote whenever the route or the
  // pricing-relevant fields change, debounced so it doesn't fire on every
  // keystroke. This is purely informational — nothing is booked or saved.
  useEffect(() => {
    if (!routeInfo?.distanceKm) {
      setEstimate(null);
      return;
    }
    const timer = setTimeout(() => {
      setEstimating(true);
      getPriceEstimate({
        distanceKm: routeInfo.distanceKm,
        weightKg: form.weightKg || null,
        dimensions: form.dimensions,
        vehicleType: form.requiredVehicleType,
        priority: form.priority,
      })
        .then(setEstimate)
        .catch(() => setEstimate(null))
        .finally(() => setEstimating(false));
    }, PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [routeInfo, form.weightKg, form.dimensions, form.requiredVehicleType, form.priority]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        customerId: form.customerId || null,
        newCustomer: form.customerId
          ? null
          : { fullName: form.newCustomerName, phone: form.newCustomerPhone },
        receiver: {
          fullName: form.receiverName,
          phone: form.receiverPhone,
          address: form.receiverAddress,
        },
        pickupLocation: form.pickup?.label?.split(',')[0] || form.pickup?.label || '',
        pickupLat: form.pickup?.lat,
        pickupLng: form.pickup?.lng,
        pickupDatetime: form.pickupDatetime,
        destination: form.destination?.label?.split(',')[0] || form.destination?.label || '',
        destinationLat: form.destination?.lat,
        destinationLng: form.destination?.lng,
        requiredVehicleType: form.requiredVehicleType,
        deliveryDeadline: form.deliveryDeadline || null,
        weightKg: form.weightKg || null,
        dimensions: form.dimensions,
        parcelType: form.parcelType,
        priority: form.priority,
        remarks: form.remarks,
      };
      const shipment = await createShipment(payload);
      navigate(`/shipments/${shipment.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create shipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>New Shipment Request</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="subtitle1" fontWeight={600}>Sender</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Existing Customer (optional)"
              value={form.customerId} onChange={set('customerId')}
            >
              <MenuItem value="">— New customer —</MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {!form.customerId && (
            <>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Customer Name" value={form.newCustomerName}
                  onChange={set('newCustomerName')} required />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Customer Phone" value={form.newCustomerPhone}
                  onChange={set('newCustomerPhone')} />
              </Grid>
            </>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={600}>Pickup Details</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <LocationPicker
              label="Pickup location"
              value={form.pickup}
              onPick={(p) => setForm((f) => ({ ...f, pickup: p }))}
              height={230}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="datetime-local" label="Pickup Date & Time"
              InputLabelProps={{ shrink: true }} value={form.pickupDatetime}
              onChange={set('pickupDatetime')} required />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={600}>Delivery Details</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={8}>
            <LocationPicker
              label="Destination"
              value={form.destination}
              onPick={(p) => setForm((f) => ({ ...f, destination: p }))}
              height={230}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="date" label="Delivery Deadline"
              InputLabelProps={{ shrink: true }} value={form.deliveryDeadline}
              onChange={set('deliveryDeadline')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Receiver Name" value={form.receiverName}
              onChange={set('receiverName')} required />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Receiver Phone" value={form.receiverPhone}
              onChange={set('receiverPhone')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Receiver Address" value={form.receiverAddress}
              onChange={set('receiverAddress')} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={600}>Parcel Details</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth type="number" label="Weight (kg)" value={form.weightKg}
              onChange={set('weightKg')} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select fullWidth label="Required Vehicle Type" value={form.requiredVehicleType}
              onChange={set('requiredVehicleType')}>
              {VEHICLE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Dimensions (cm)" value={form.dimensions}
              onChange={set('dimensions')} placeholder="30 x 20 x 20" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select fullWidth label="Parcel Type" value={form.parcelType}
              onChange={set('parcelType')}>
              {PARCEL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select fullWidth label="Priority" value={form.priority}
              onChange={set('priority')}>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Remarks (optional)"
              value={form.remarks} onChange={set('remarks')} />
          </Grid>
        </Grid>

        {form.pickup?.lat && form.destination?.lat && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Route preview (OSRM road network)
            </Typography>
            <RouteMap
              start={form.pickup}
              end={form.destination}
              height={220}
              onRoute={setRouteInfo}
            />
          </Box>
        )}

        {routeInfo && (
          <Paper
            variant="outlined"
            sx={{ p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'action.hover' }}
          >
            <PaidIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Estimated price — before a vehicle is selected, based on distance, weight,
                volume, vehicle type, priority, and the backhaul discount
              </Typography>
              {estimating && !estimate ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Calculating…</Typography>
                </Box>
              ) : estimate ? (
                <>
                  <Typography variant="h6" fontWeight={700}>
                    Estimated Price: LKR {Number(estimate.estimatedPrice).toLocaleString('en-LK')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Includes a {estimate.backhaulDiscountPercent}% backhaul discount
                    (−LKR {Number(estimate.backhaulDiscountAmount).toLocaleString('en-LK')})
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Price estimate unavailable right now — you can still submit the request.
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button type="button" variant="outlined" onClick={() => navigate('/shipments')}>Reset</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}