import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const getTimeline = (tenantId) => client.get(`/${tenantId}/timeline`);

export default { getTimeline };
