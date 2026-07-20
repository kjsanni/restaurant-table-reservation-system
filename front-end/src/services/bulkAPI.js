import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/admin/bulk`,
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

export const bulkSuspend = (tenantIds, reason) =>
  client.post("/suspend", { tenantIds, reason });
export const bulkChangePlan = (tenantIds, plan) =>
  client.post("/change-plan", { tenantIds, plan });
export const bulkSendEmail = (tenantIds, subject, body) =>
  client.post("/send-email", { tenantIds, subject, body });

export default { bulkSuspend, bulkChangePlan, bulkSendEmail };
