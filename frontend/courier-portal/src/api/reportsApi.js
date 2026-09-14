import apiClient from './apiClient';

export const getCourierReportSummary = () => apiClient.get('/courier/reports/summary').then((r) => r.data);
