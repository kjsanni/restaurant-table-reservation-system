import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const getBranding = (tenantId) => client.get(`/${tenantId}/branding`);
export const updateBranding = (tenantId, data) =>
  client.patch(`/${tenantId}/branding`, data);

export default { getBranding, updateBranding };
