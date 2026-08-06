import API from "../API";

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const emailLogs = () => {
  return API.post("/admin/logs/email");
};

export const getRecentActivity = (limit = 20) => {
  return API.get(`/admin/audit/recent?limit=${limit}`);
};

export const getAuditLogs = (params = {}) => {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.entityType) query.set("entityType", params.entityType);
  if (params.userId) query.set("userId", params.userId);
  if (params.search) query.set("search", params.search);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.limit) query.set("pageSize", params.limit);
  return API.get(`/admin/audit?${query.toString()}`);
};

export const exportAuditLog = (params = {}) => {
  return API.get(`/admin/audit/export${buildQueryString(params)}`, {
    responseType: "blob",
  });
};

export const getPlatformAuditLog = (params = {}) => {
  return API.get(`/admin/audit${buildQueryString(params)}`);
};

export const getPlatformAuditLogForUser = (userId, params = {}) => {
  return API.get(`/admin/audit/user/${userId}${buildQueryString(params)}`);
};

export const getPlatformAuditLogForTenant = (tenantId, params = {}) => {
  return API.get(`/admin/audit/tenant/${tenantId}${buildQueryString(params)}`);
};

export const getSuspiciousActivity = (params = {}) => {
  return API.get(`/admin/audit/suspicious${buildQueryString(params)}`);
};

export const getBruteForceAggregation = () => {
  return API.get("/admin/security/brute-force-aggregation");
};

export const getComplianceScorecard = () => {
  return API.get("/admin/compliance/scorecard");
};

export const listSessions = () => {
  return API.get("/admin/sessions");
};

export const revokeSession = (id) => {
  return API.delete(`/admin/sessions/${id}`);
};

export const revokeAllSessions = () => {
  return API.post("/admin/sessions/revoke-all");
};
