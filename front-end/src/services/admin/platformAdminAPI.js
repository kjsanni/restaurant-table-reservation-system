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

export const listPlatformRoles = () => {
  return API.get("/admin/platform/roles");
};

export const listPlatformUsers = () => {
  return API.get("/admin/platform/users");
};

export const createPlatformUser = (data) => {
  return API.post("/admin/platform/users", data);
};

export const getUsers = () => {
  return API.get("/auth/users");
};

export const assignPlatformRole = (userId, role) => {
  return API.post("/admin/platform/roles/assign", { userId, role });
};

export const revokePlatformRole = (userId, role) => {
  return API.post("/admin/platform/roles/revoke", { userId, role });
};

export const requestBreakGlass = (justification, durationMinutes) => {
  return API.post("/admin/break-glass/request", {
    justification,
    durationMinutes,
  });
};

export const approveBreakGlass = (requestId, notes) => {
  return API.post(`/admin/break-glass/approve/${requestId}`, { notes });
};

export const denyBreakGlass = (requestId, notes) => {
  return API.post(`/admin/break-glass/deny/${requestId}`, { notes });
};

export const revokeBreakGlass = (requestId) => {
  return API.post(`/admin/break-glass/revoke/${requestId}`);
};

export const listBreakGlassRequests = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return API.get(`/admin/break-glass/requests${qs ? `?${qs}` : ""}`);
};

export const listMyBreakGlassRequests = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return API.get(`/admin/break-glass/my-requests${qs ? `?${qs}` : ""}`);
};

export const expireBreakGlass = () => {
  return API.post("/admin/break-glass/expire");
};

export const setupTOTP = () => API.post("/admin/totp/setup");
export const confirmTOTP = (token) =>
  API.post("/admin/totp/confirm", { token });
export const disableTOTP = () => API.post("/admin/totp/disable");
export const getTOTPStatus = () => API.get("/admin/totp/status");
export const regenerateBackupCodes = () =>
  API.post("/admin/totp/backup-codes/regenerate");
export const verifyBackupCode = (code) =>
  API.post("/admin/totp/backup-codes/verify", { code });

export const listIncidents = () => {
  return API.get("/admin/incidents");
};

export const createIncident = (data) => {
  return API.post("/admin/incidents", data);
};

export const updateIncident = (id, data) => {
  return API.patch(`/admin/incidents/${id}`, data);
};

export const deleteIncident = (id) => {
  return API.delete(`/admin/incidents/${id}`);
};

export const startImpersonation = (data) => {
  return API.post("/admin/impersonation", data);
};

export const endImpersonation = (id) => {
  return API.post(`/admin/impersonation/${id}/end`);
};

export const listImpersonation = () => {
  return API.get("/admin/impersonation");
};

export const crossTenantSearch = (params = {}) => {
  return API.get("/admin/search", { params });
};

export const getPlatformDebug = () => {
  return API.get("/admin/debug/platform");
};
