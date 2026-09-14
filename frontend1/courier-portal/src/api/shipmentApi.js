import apiClient from './apiClient';

// Talks to courier-service through the gateway route /api/courier/**
export const getShipments = () => apiClient.get('/courier/shipments').then((r) => r.data);

export const getShipmentById = (id) => apiClient.get(`/courier/shipments/${id}`).then((r) => r.data);

export const getShipmentTracking = (id) =>
  apiClient.get(`/courier/shipments/${id}/tracking`).then((r) => r.data);

export const createShipment = (payload) =>
  apiClient.post('/courier/shipments', payload).then((r) => r.data);

export const updateShipmentStatus = (id, status, location) =>
  apiClient.patch(`/courier/shipments/${id}/status`, { status, location }).then((r) => r.data);

export const getDashboardSummary = () =>
  apiClient.get('/courier/dashboard/summary').then((r) => r.data);
