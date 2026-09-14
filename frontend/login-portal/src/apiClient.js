import axios from 'axios';

// The ONLY client that talks to the Authentication Service directly (login + register).
// Every other app consumes JWTs it already issued — authentication logic is never
// duplicated anywhere else.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:18080/api',
});

export default apiClient;