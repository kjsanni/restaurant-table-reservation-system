import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const client = buildApiClient(`${API_BASE}/public/tenants`, {
  withRefresh: false,
  withTenantHeader: false,
  withAuthHeader: false,
});

export const getBySlug = async (slug) => {
  const response = await client.get(`/${encodeURIComponent(slug)}`);
  return response;
};

export default {
  getBySlug,
};
