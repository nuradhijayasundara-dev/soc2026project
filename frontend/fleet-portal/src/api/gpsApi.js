import apiClient from './apiClient';

// Talks to gps-service through the gateway route /api/gps/**
export const getLiveLocations = (truckIds) =>
  apiClient
    .get('/gps/live', { params: truckIds?.length ? { truckIds: truckIds.join(',') } : {} })
    .then((r) => r.data);

export const getTruckHistory = (truckId) =>
  apiClient.get(`/gps/history/truck/${truckId}`).then((r) => r.data);
