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

export const listFeatureFlags = () => {
  return API.get("/admin/feature-flags");
};

export const getTenantFeatureFlags = (id) => {
  return API.get(`/admin/feature-flags/tenants/${id}`);
};

export const updateTenantFeatureFlags = (id, featureFlags) => {
  return API.patch(`/admin/feature-flags/tenants/${id}`, { featureFlags });
};

export const getGlobalFeatureFlags = () => {
  return API.get("/admin/feature-flags/global");
};

export const updateGlobalFeatureFlags = (flags) => {
  return API.put("/admin/feature-flags/global", { flags });
};

export const toggleSalonModule = (id, enabled) => {
  return API.post(`/admin/feature-flags/tenants/${id}/salon-module`, {
    enabled,
  });
};

export const getFlagAuditLog = (tenantId) => {
  return API.get(`/admin/feature-flags/tenants/${tenantId}/audit-log`);
};

export const bulkCategoryAction = (tenantId, category, action) => {
  return API.post(`/admin/feature-flags/tenants/${tenantId}/bulk`, {
    category,
    action,
  });
};

export const resetTenantFlags = (tenantId) => {
  return API.post(`/admin/feature-flags/tenants/${tenantId}/reset`);
};

export const createFlagPreset = (data) => {
  return API.post("/admin/feature-flags/presets", data);
};

export const listFlagPresets = () => {
  return API.get("/admin/feature-flags/presets");
};

export const applyFlagPreset = (tenantId, presetId) => {
  return API.post(`/admin/feature-flags/presets/${presetId}/apply/${tenantId}`);
};

export const bulkEnableTenants = (tenantIds) => {
  return API.post("/admin/bulk/enable", { tenantIds });
};

export const bulkExportTenants = (tenantIds) => {
  return API.post("/admin/bulk/export", { tenantIds });
};

export const bulkAssignFeatureFlags = (tenantIds, featureFlags) => {
  return API.post("/admin/bulk/feature-flags", { tenantIds, featureFlags });
};

export const bulkDeleteTenants = (tenantIds) => {
  return API.post("/admin/bulk/delete", { tenantIds });
};

export const bulkProvisionTenants = (tenantIds) => {
  return API.post("/admin/bulk/provision", { tenantIds });
};

export const listPlatformSettings = () => {
  return API.get("/admin/platform-settings");
};

export const updatePlatformSetting = (key, value) => {
  return API.put("/admin/platform-settings", { key, value });
};

export const listPlatformSettingChanges = () => {
  return API.get("/admin/platform-settings/audit");
};

export const getTenantHealthScores = () => {
  return API.get("/admin/trust-safety/health-scores");
};

export const getTenantGrowth = () => {
  return API.get("/admin/analytics/growth");
};

export const getChurnAnalysis = (params = {}) => {
  return API.get(`/admin/analytics/churn${buildQueryString(params)}`);
};

export const getLtvCac = () => {
  return API.get("/admin/analytics/ltv-cac");
};

export const getTenantDebug = (tenantId) => {
  return API.get(`/admin/debug/tenant/${tenantId}`);
};

export const exportTenantMigration = (tenantId) => {
  return API.get(`/admin/tenants/${tenantId}/migration/export`);
};

export const importTenantMigration = (payload) => {
  return API.post("/admin/tenants/migration/import", payload);
};

export const lockTenant = (tenantId) => {
  return API.post(`/admin/incidents/${tenantId}/lock-tenant`);
};

export const resetTenantTokens = (tenantId) => {
  return API.post(`/admin/incidents/${tenantId}/reset-tokens`);
};

export const forceLogoutTenant = (tenantId) => {
  return API.post(`/admin/incidents/${tenantId}/force-logout`);
};

export const listTenantMigrations = (tenantId) => {
  return API.get(`/admin/tenants/${tenantId}/migrations`);
};

export const getTenantMigrationStatus = (tenantId) => {
  return API.get(`/admin/tenants/${tenantId}/migrations/status`);
};

export const enqueueTenantMigration = (tenantId, data) => {
  return API.post(`/admin/tenants/${tenantId}/migrations`, data);
};

export const runTenantMigration = (id, runner) => {
  return API.post(`/admin/migrations/${id}/run`, { runner });
};

export const pauseTenantMigration = (id) => {
  return API.post(`/admin/migrations/${id}/pause`);
};

export const resumeTenantMigration = (id, runner) => {
  return API.post(`/admin/migrations/${id}/resume`, { runner });
};

export const rollbackTenantMigration = (id, rollbackRunner) => {
  return API.post(`/admin/migrations/${id}/rollback`, { rollbackRunner });
};

export const startTenantProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning`);
};

export const pauseTenantProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/pause`);
};

export const resumeTenantProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/resume`);
};

export const rollbackTenantProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/rollback`);
};

export const getTenantProvisioningStatus = (tenantId) => {
  return API.get(`/admin/tenants/${tenantId}/provisioning`);
};

export const listProvisioningSteps = () => {
  return API.get("/admin/provisioning/steps");
};
