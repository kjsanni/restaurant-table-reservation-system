import API from "./API";

const getDashboard = () => {
  return API.get("/admin/tenants/dashboard");
};

const getAll = (params = {}) => {
  return API.get("/admin/tenants", { params });
};

const getById = (id) => {
  return API.get(`/admin/tenants/${id}`);
};

const create = (data) => {
  return API.post("/admin/tenants", data);
};

const update = (id, data) => {
  return API.patch(`/admin/tenants/${id}`, data);
};

const enable = (id) => {
  return API.post(`/admin/tenants/${id}/enable`);
};

const disable = (id, data = {}) => {
  return API.post(`/admin/tenants/${id}/disable`, data);
};

const deleteTenant = (id) => {
  return API.delete(`/admin/tenants/${id}`);
};

const exportData = (id) => {
  return API.get(`/admin/tenants/${id}/export`);
};

const exportSelfData = () => {
  return API.get(`/tenant/export`);
};

const anonymizeData = (id) => {
  return API.post(`/admin/tenants/${id}/anonymize`);
};

const bulkChangeVertical = (tenantIds, businessVertical) => {
  return API.post("/admin/tenants/bulk/change-vertical", {
    tenantIds,
    businessVertical,
  });
};

const getProvisioningStatus = (tenantId) => {
  return API.get(`/admin/tenants/${tenantId}/provisioning`);
};

const startProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning`);
};

const pauseProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/pause`);
};

const resumeProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/resume`);
};

const rollbackProvisioning = (tenantId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/rollback`);
};

const getProvisioningSteps = () => {
  return API.get("/admin/provisioning/steps");
};

const getDLQStatus = (tenantId, limit = 50) => {
  return API.get(`/admin/tenants/${tenantId}/provisioning/dlq`, {
    params: { limit },
  });
};

const retryDLQEntry = (tenantId, jobId) => {
  return API.post(`/admin/tenants/${tenantId}/provisioning/dlq/${jobId}/retry`);
};

const getEncryptionKeys = () => {
  return API.get("/tenant/encryption-keys");
};

const createEncryptionKey = (data) => {
  return API.post("/tenant/encryption-keys", data);
};

const rotateEncryptionKey = (id) => {
  return API.post(`/tenant/encryption-keys/${id}/rotate`);
};

const retireEncryptionKey = (id) => {
  return API.post(`/tenant/encryption-keys/${id}/retire`);
};

const deleteEncryptionKey = (id) => {
  return API.delete(`/tenant/encryption-keys/${id}`);
};

const updateFeatureFlags = (id, data) => {
  return API.patch(`/admin/feature-flags/tenants/${id}`, {
    featureFlags: data,
  });
};

export default {
  create,
  getDashboard,
  getAll,
  getById,
  update,
  updateFeatureFlags,
  enable,
  disable,
  deleteTenant,
  exportData,
  exportSelfData,
  anonymizeData,
  bulkChangeVertical,
  getProvisioningStatus,
  startProvisioning,
  pauseProvisioning,
  resumeProvisioning,
  rollbackProvisioning,
  getProvisioningSteps,
  getDLQStatus,
  retryDLQEntry,
  getEncryptionKeys,
  createEncryptionKey,
  rotateEncryptionKey,
  retireEncryptionKey,
  deleteEncryptionKey,
};
