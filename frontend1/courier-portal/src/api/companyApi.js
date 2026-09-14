import apiClient from './apiClient';

// Courier company registry (courier-service, reached through the Gateway).
// A courier operator must register a company before customers / shipments are
// possible — until then every /courier/** call returns 404 "No courier company".
export const getMyCompany = () => apiClient.get('/courier/company/me').then((r) => r.data);

export const registerCompany = (payload) =>
  apiClient.put('/courier/company/me', payload).then((r) => r.data);

// True when a request was rejected purely because the account has no courier
// company yet — the UI turns this into the company-setup onboarding flow.
export const isMissingCompanyError = (err) =>
  err?.response?.status === 404 &&
  /courier company/i.test(err?.response?.data?.message || err?.response?.data?.error || '');