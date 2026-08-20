import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

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
