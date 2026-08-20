import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const extendTrial = (tenantId, days) =>
  client.post(`/${tenantId}/trial/extend`, { days });
export const convertTrial = (tenantId, data) =>
  client.post(`/${tenantId}/trial/convert`, data);

export default { extendTrial, convertTrial };
