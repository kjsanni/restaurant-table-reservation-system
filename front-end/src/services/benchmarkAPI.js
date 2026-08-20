import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/benchmarks`);

/**
 * @param {string} [plan] - Optional plan filter
 */
export const getPlatformBenchmarks = (plan = null) => {
  const params = plan ? { plan } : {};
  return client.get("/", { params });
};

export default { getPlatformBenchmarks };
