import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

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
