import apiClient from './apiClient';

// Talks to fleet-service through the gateway route /api/fleet/**
export const getTrucks = () => apiClient.get('/fleet/trucks').then((r) => r.data);

export const getTruckById = (id) => apiClient.get(`/fleet/trucks/${id}`).then((r) => r.data);

export const addTruck = (payload) => apiClient.post('/fleet/trucks', payload).then((r) => r.data);

export const getTruckAvailability = (id) =>
  apiClient.get(`/fleet/trucks/${id}/availability`).then((r) => r.data);

// "Available capacity input" — route, date/time, and free capacity for a truck
export const addTruckAvailability = (id, payload) =>
  apiClient.post(`/fleet/trucks/${id}/availability`, payload).then((r) => r.data);

export const getFleetDashboardSummary = () =>
  apiClient.get('/fleet/dashboard/summary').then((r) => r.data);
