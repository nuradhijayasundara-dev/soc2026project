import apiClient from './apiClient';

export const getTrips = () => apiClient.get('/fleet/trips').then((r) => r.data);

export const getTripById = (id) => apiClient.get(`/fleet/trips/${id}`).then((r) => r.data);

// "Trip creation" — pick a truck + driver, optionally against a real shipment
export const createTrip = (payload) => apiClient.post('/fleet/trips', payload).then((r) => r.data);

// "Driver assignment" — swap the driver on a not-yet-started trip
export const assignDriver = (tripId, driverId) =>
  apiClient.patch(`/fleet/trips/${tripId}/assign-driver`, { driverId }).then((r) => r.data);
