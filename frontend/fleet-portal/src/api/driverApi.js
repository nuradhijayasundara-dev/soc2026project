import apiClient from './apiClient';

export const getDrivers = (availableOnly = false) =>
  apiClient.get('/fleet/drivers', { params: availableOnly ? { availableOnly: true } : {} })
    .then((r) => r.data);

export const registerDriver = (payload) =>
  apiClient.post('/fleet/drivers', payload).then((r) => r.data);

export const getDriverById = (id) => apiClient.get(`/fleet/drivers/${id}`).then((r) => r.data);
