import apiClient from './apiClient';

// Talks to payment-service through the gateway route /api/payment/**
export const getMyBookingInvoices = () => apiClient.get('/payment/invoices/fleet/mine').then((r) => r.data);

export const getRevenueSummary = () => apiClient.get('/payment/revenue/summary').then((r) => r.data);
