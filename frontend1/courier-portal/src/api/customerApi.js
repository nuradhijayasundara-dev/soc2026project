import apiClient from './apiClient';

export const getCustomers = () => apiClient.get('/courier/customers').then((r) => r.data);

export const createCustomer = (payload) =>
  apiClient.post('/courier/customers', payload).then((r) => r.data);
