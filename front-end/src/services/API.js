import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { getCsrfToken } from "@/utils/csrf";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
});

let refreshing = false;
const refreshQueue = [];

const processQueue = (error) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  refreshQueue.length = 0;
};

API.interceptors.request.use(async (config) => {
  if (config.url !== "/csrf-token") {
    const token = await getCsrfToken();
    if (token) {
      config.headers["x-xsrf-token"] = token;
    }
  }
  const authStore = useAuthStore();
  if (authStore.currentTenant) {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLogout = originalRequest.url?.includes("/auth/logout");
      const isRefresh = originalRequest.url?.includes("/auth/refresh-token");
      if (isLogout || isRefresh) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      if (refreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      refreshing = true;
      try {
        await authStore.refreshToken();
        processQueue();
        return API(originalRequest);
      } catch (err) {
        authStore.logout();
        processQueue(err);
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
