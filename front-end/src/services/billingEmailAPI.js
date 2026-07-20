import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/admin/billing-emails`,
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

export const sendPaymentReminder = (tenantIds) =>
  client.post("/payment-reminder", { tenantIds });
export const sendSuspensionNotice = (tenantIds) =>
  client.post("/suspension-notice", { tenantIds });
export const sendTrialExpiry = (tenantIds) =>
  client.post("/trial-expiry", { tenantIds });

export default { sendPaymentReminder, sendSuspensionNotice, sendTrialExpiry };
