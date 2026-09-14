import apiClient from './apiClient';

// Fleet company registry (fleet-service, reached through the Gateway).
// A fleet manager must register a company before trucks / drivers /
// availability are possible — until then every /fleet/** call returns
// 404 "No fleet company".
export const getMyCompany = () => apiClient.get('/fleet/company/me').then((r) => r.data);

export const registerCompany = (payload) =>
  apiClient.put('/fleet/company/me', payload).then((r) => r.data);

// True when a request was rejected purely because the account has no fleet
// company yet — the UI turns this into the company-setup onboarding flow.
export const isMissingCompanyError = (err) =>
  err?.response?.status === 404 &&
  /fleet company/i.test(err?.response?.data?.message || err?.response?.data?.error || '');