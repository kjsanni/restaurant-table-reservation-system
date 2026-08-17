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
  anonymizeData,
  bulkChangeVertical,
  getProvisioningStatus,
};
