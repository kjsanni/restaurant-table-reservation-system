import { buildApiClient } from "./buildApiClient";
import { useAuthStore } from "@/stores/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const attachTenantHeader = (config) => {
  const authStore = useAuthStore();
  if (authStore.currentTenant) {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
};

const adminClient = buildApiClient(`${API_BASE}/admin/notifications`, {
  withRefresh: false,
});
adminClient.interceptors.request.use(attachTenantHeader);

const client = buildApiClient(`${API_BASE}/notifications`, {
  withRefresh: false,
});
client.interceptors.request.use(attachTenantHeader);

export const listNotifications = (params = {}) =>
  adminClient.get("/", { params });
export const createNotification = (data) => adminClient.post("/", data);
export const markRead = (id) => adminClient.post(`/${id}/read`);
export const sendTestWhatsApp = (to, message) =>
  client.post("/whatsapp/test", { to, message });
export const sendTestEmail = (to) => client.post("/email/test", { to });
export const sendTestSms = (to, message) =>
  client.post("/sms/test", { to, message });
export const getPaystackWebhookInfo = () =>
  client.get("/paystack/webhook-info");

export default {
  listNotifications,
  createNotification,
  markRead,
  sendTestWhatsApp,
  sendTestEmail,
  sendTestSms,
  getPaystackWebhookInfo,
};
