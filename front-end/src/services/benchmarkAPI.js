import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/admin/benchmarks`,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "x-xsrf-token",
});

/**
 * @param {string} [plan] - Optional plan filter
 */
export const getPlatformBenchmarks = (plan = null) => {
  const params = plan ? { plan } : {};
  return client.get("/", { params });
};

export default { getPlatformBenchmarks };
