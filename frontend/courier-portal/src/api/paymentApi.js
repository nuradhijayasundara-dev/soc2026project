import apiClient from './apiClient';

// Talks to payment-service through the gateway route /api/payment/**
export const getMyInvoices = () => apiClient.get('/payment/invoices/mine').then((r) => r.data);

export const getInvoice = (id) => apiClient.get(`/payment/invoices/${id}`).then((r) => r.data);

export const getPaymentHistory = (invoiceId) =>
  apiClient.get(`/payment/invoices/${invoiceId}/payments`).then((r) => r.data);

// "Payment API" — courier pays an invoice (simulated, no real gateway)
export const payInvoice = (invoiceId, method) =>
  apiClient.post(`/payment/invoices/${invoiceId}/pay`, { method }).then((r) => r.data);

// Pre-booking price estimate (Create Shipment form) — pure calculation, no
// persistence, safe to call repeatedly as the form fields change.
export const getPriceEstimate = ({ distanceKm, weightKg, dimensions, vehicleType, priority }) =>
  apiClient
    .post('/payment/pricing/estimate', { distanceKm, weightKg, dimensions, vehicleType, priority })
    .then((r) => r.data);
