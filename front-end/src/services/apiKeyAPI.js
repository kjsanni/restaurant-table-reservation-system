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

export const listApiKeys = (tenantId) => client.get(`/${tenantId}/api-keys`);
export const createApiKey = (tenantId, data) =>
  client.post(`/${tenantId}/api-keys`, data);
export const revokeApiKey = (tenantId, keyId) =>
  client.post(`/${tenantId}/api-keys/${keyId}/revoke`);

export default { listApiKeys, createApiKey, revokeApiKey };
