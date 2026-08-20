import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const listApiKeys = (tenantId) => client.get(`/${tenantId}/api-keys`);
export const createApiKey = (tenantId, data) =>
  client.post(`/${tenantId}/api-keys`, data);
export const revokeApiKey = (tenantId, keyId) =>
  client.post(`/${tenantId}/api-keys/${keyId}/revoke`);

export default { listApiKeys, createApiKey, revokeApiKey };
