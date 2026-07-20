import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "x-xsrf-token",
});

API.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (
    authStore.currentTenant &&
    import.meta.env.VITE_TENANT_MODE === "enabled"
  ) {
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
      if (isLogout) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        await authStore.refreshToken();
        return API(originalRequest);
      } catch {
        authStore.logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
