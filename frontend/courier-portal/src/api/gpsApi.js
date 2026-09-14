import apiClient from './apiClient';

// GPS positions through the gateway route /api/gps/**
export const getLiveGps = () =>
  apiClient.get('/gps/live').then((r) => r.data);

export const getLiveGpsByTruck = (truckId) =>
  apiClient.get(`/gps/live/${truckId}`).then((r) => r.data);