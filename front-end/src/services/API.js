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
  if (authStore.currentTenant && import.meta.env.VITE_TENANT_MODE === "enabled") {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
});

export default API;
