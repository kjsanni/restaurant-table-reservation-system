import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/bulk`);

export const bulkSuspend = (tenantIds, reason) =>
  client.post("/suspend", { tenantIds, reason });
export const bulkChangePlan = (tenantIds, plan) =>
  client.post("/change-plan", { tenantIds, plan });
export const bulkSendEmail = (tenantIds, subject, body) =>
  client.post("/send-email", { tenantIds, subject, body });
export const bulkEnable = (tenantIds) => client.post("/enable", { tenantIds });
export const bulkExport = (tenantIds) => client.post("/export", { tenantIds });
export const bulkAssignFeatureFlags = (tenantIds, featureFlags) =>
  client.post("/feature-flags", { tenantIds, featureFlags });
export const bulkDelete = (tenantIds) => client.post("/delete", { tenantIds });

export default {
  bulkSuspend,
  bulkChangePlan,
  bulkSendEmail,
  bulkEnable,
  bulkExport,
  bulkAssignFeatureFlags,
  bulkDelete,
};
