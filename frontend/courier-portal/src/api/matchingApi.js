import apiClient from './apiClient';

// Talks to matching-service through the gateway route /api/matching/**
export const requestBackhaulMatch = (shipmentId) =>
  apiClient.post('/matching/requests', { shipmentId }).then((r) => r.data);

export const getMatchRequest = (requestId) =>
  apiClient.get(`/matching/requests/${requestId}`).then((r) => r.data);

export const getMatchResults = (requestId) =>
  apiClient.get(`/matching/requests/${requestId}/results`).then((r) => r.data);

// "Accept Match" button — verifies + reserves the truck's capacity immediately,
// then sends the booking request to the fleet manager for confirmation
export const acceptMatch = (resultId) =>
  apiClient.post(`/matching/results/${resultId}/accept-match`).then((r) => r.data);

// "Check again" — forces an immediate re-run of matching for a request stuck in
// WAITING_FOR_MATCH, instead of waiting for the backend's own retry sweep.
export const retryMatch = (requestId) =>
  apiClient.post(`/matching/requests/${requestId}/retry`).then((r) => r.data);
