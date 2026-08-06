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

export const listComplianceRules = (vertical) => {
  const qs = vertical ? `?vertical=${vertical}` : "";
  return API.get(`/admin/compliance-rules${qs}`);
};

export const createComplianceRule = (data) => {
  return API.post("/admin/compliance-rules", data);
};

export const updateComplianceRule = (id, data) => {
  return API.patch(`/admin/compliance-rules/${id}`, data);
};

export const deleteComplianceRule = (id) => {
  return API.delete(`/admin/compliance-rules/${id}`);
};

export const listComplianceEvidence = (params = {}) => {
  return API.get(`/admin/compliance${buildQueryString(params)}`);
};

export const getComplianceEvidence = (id) => {
  return API.get(`/admin/compliance/${id}`);
};

export const createComplianceEvidence = (data) => {
  return API.post("/admin/compliance", data);
};

export const updateComplianceEvidence = (id, data) => {
  return API.patch(`/admin/compliance/${id}`, data);
};

export const deleteComplianceEvidence = (id) => {
  return API.delete(`/admin/compliance/${id}`);
};

export const listDataRetentionPolicies = () => {
  return API.get("/admin/data-retention/policies");
};

export const createDataRetentionPolicy = (data) => {
  return API.post("/admin/data-retention/policies", data);
};

export const updateDataRetentionPolicy = (id, data) => {
  return API.patch(`/admin/data-retention/policies/${id}`, data);
};

export const deleteDataRetentionPolicy = (id) => {
  return API.delete(`/admin/data-retention/policies/${id}`);
};

export const executeDataRetention = () => {
  return API.post("/admin/data-retention/execute");
};

export const listSubProcessors = () => {
  return API.get("/admin/sub-processors");
};

export const createSubProcessor = (data) => {
  return API.post("/admin/sub-processors", data);
};

export const updateSubProcessor = (id, data) => {
  return API.patch(`/admin/sub-processors/${id}`, data);
};

export const deleteSubProcessor = (id) => {
  return API.delete(`/admin/sub-processors/${id}`);
};

export const listAnnouncements = (channel) => {
  const qs = channel ? `?channel=${channel}` : "";
  return API.get(`/admin/announcements${qs}`);
};

export const createAnnouncement = (data) => {
  return API.post("/admin/announcements", data);
};

export const updateAnnouncement = (id, data) => {
  return API.patch(`/admin/announcements/${id}`, data);
};

export const deleteAnnouncement = (id) => {
  return API.delete(`/admin/announcements/${id}`);
};

export const listNotificationTemplates = (channel) => {
  const qs = channel ? `?channel=${channel}` : "";
  return API.get(`/admin/notification-templates${qs}`);
};

export const createNotificationTemplate = (data) => {
  return API.post("/admin/notification-templates", data);
};

export const updateNotificationTemplate = (id, data) => {
  return API.patch(`/admin/notification-templates/${id}`, data);
};

export const deleteNotificationTemplate = (id) => {
  return API.delete(`/admin/notification-templates/${id}`);
};
