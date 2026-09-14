import apiClient from './apiClient';

// Talks to fleet-service through the gateway route /api/fleet/**
export const getMyAvailability = () => apiClient.get('/fleet/availability/mine').then((r) => r.data);

// "Post Backhaul Availability" — truck, current location, return destination, capacity
export const postBackhaulAvailability = (payload) =>
  apiClient.post('/fleet/availability', payload).then((r) => r.data);
