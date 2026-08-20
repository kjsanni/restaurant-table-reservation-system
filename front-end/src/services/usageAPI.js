import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/usage`);

export const listUsage = (params = {}) => client.get("/", { params });
export const getUsage = (id) => client.get(`/${id}`);

export default { listUsage, getUsage };
