import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  // Attach JWT from storage
  const token = global.__AUTH_TOKEN__ || null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach tenant header if set
  const tenantId = global.__TENANT_ID__ || null;
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      global.__AUTH_TOKEN__ = null;
    }
    return Promise.reject(error);
  }
);

export default api;
