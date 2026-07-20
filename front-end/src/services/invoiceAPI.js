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

export const listInvoices = (tenantId, params = {}) =>
  client.get(`/${tenantId}/invoices`, { params });
export const getInvoice = (tenantId, invoiceId) =>
  client.get(`/${tenantId}/invoices/${invoiceId}`);
export const createInvoice = (tenantId, data) =>
  client.post(`/${tenantId}/invoices`, data);
export const updateInvoice = (tenantId, invoiceId, data) =>
  client.patch(`/${tenantId}/invoices/${invoiceId}`, data);
export const deleteInvoice = (tenantId, invoiceId) =>
  client.delete(`/${tenantId}/invoices/${invoiceId}`);

export default {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
