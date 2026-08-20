import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/audit`);

export const listAuditLogs = (params = {}) => client.get("/", { params });

export default { listAuditLogs };
