import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/admin/tenants`,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "x-xsrf-token",
});

client.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (
    import.meta.env.VITE_TENANT_MODE === "enabled" &&
    authStore.currentTenant
  ) {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
});

export const listDsarRequests = (tenantId) =>
  client.get(`/${tenantId}/dsar-requests`);

export const getDsarRequest = (tenantId, id) =>
  client.get(`/${tenantId}/dsar-requests/${id}`);

export const createDsarRequest = (tenantId, data) =>
  client.post(`/${tenantId}/dsar-requests`, data);

export const updateDsarRequest = (tenantId, id, data) =>
  client.patch(`/${tenantId}/dsar-requests/${id}`, data);

export default {
  listDsarRequests,
  getDsarRequest,
  createDsarRequest,
  updateDsarRequest,
};
