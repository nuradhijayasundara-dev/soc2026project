import apiClient from './apiClient';

// Talks to matching-service through the gateway route /api/matching/**
export const getPendingBookings = () => apiClient.get('/matching/bookings/pending').then((r) => r.data);

export const acceptBooking = (resultId) =>
  apiClient.post(`/matching/results/${resultId}/accept`).then((r) => r.data);

export const rejectBooking = (resultId) =>
  apiClient.post(`/matching/results/${resultId}/reject`).then((r) => r.data);
