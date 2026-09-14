import axios from 'axios';
import { LOGIN_PORTAL_URL } from './authApi';

// All requests go through the API Gateway, not directly to microservices.
const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:18080/api',
});

// Attach the JWT (adopted from the Login Portal's shared cookie at boot) to every request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the gateway/auth-service rejects the token, bounce back to the unified Login Portal.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = LOGIN_PORTAL_URL;
    }
    return Promise.reject(error);
  }
);

export default apiClient;