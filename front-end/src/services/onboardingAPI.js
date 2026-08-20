import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/tenants`);

export const getOnboarding = (tenantId) =>
  client.get(`/${tenantId}/onboarding`);
export const updateOnboarding = (tenantId, steps) =>
  client.patch(`/${tenantId}/onboarding`, { steps });
export const completeOnboarding = (tenantId) =>
  client.post(`/${tenantId}/onboarding/complete`);

export default { getOnboarding, updateOnboarding, completeOnboarding };
