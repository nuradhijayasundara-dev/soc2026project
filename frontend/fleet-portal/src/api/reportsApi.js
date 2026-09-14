import apiClient from './apiClient';

// "Fleet Reports": total trips, used capacity — from fleet-service.
// Backhaul revenue comes from payment-service; see revenueApi.js's getRevenueSummary.
export const getFleetReportSummary = () => apiClient.get('/fleet/reports/summary').then((r) => r.data);
