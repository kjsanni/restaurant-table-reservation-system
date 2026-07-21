import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const attachTenantHeader = (config) => {
  const authStore = useAuthStore();
  if (
    import.meta.env.VITE_TENANT_MODE === "enabled" &&
    authStore.currentTenant
  ) {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
};

// Tenant-mode admin notifications (list/create/mark-read)
const adminClient = axios.create({
  baseURL: `${API_BASE}/admin/notifications`,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "x-xsrf-token",
});
adminClient.interceptors.request.use(attachTenantHeader);

// Single-tenant notifications (test senders, webhook info)
const client = axios.create({
  baseURL: `${API_BASE}/notifications`,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "x-xsrf-token",
});
client.interceptors.request.use(attachTenantHeader);

export const listNotifications = (params = {}) =>
  adminClient.get("/", { params });
export const createNotification = (data) => adminClient.post("/", data);
export const markRead = (id) => adminClient.post(`/${id}/read`);
export const sendTestWhatsApp = (to, message) =>
  client.post("/whatsapp/test", { to, message });
export const sendTestEmail = (to) => client.post("/email/test", { to });
export const getPaystackWebhookInfo = () =>
  client.get("/paystack/webhook-info");

export default {
  listNotifications,
  createNotification,
  markRead,
  sendTestWhatsApp,
  sendTestEmail,
  getPaystackWebhookInfo,
};
