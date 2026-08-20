import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const getGracePeriod = (tenantId) =>
  client.get(`/${tenantId}/grace-period`);
export const updateGracePeriod = (tenantId, days) =>
  client.patch(`/${tenantId}/grace-period`, { days });

export default { getGracePeriod, updateGracePeriod };
