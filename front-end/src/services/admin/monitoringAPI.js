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

export const getDeploymentStatus = () => {
  return API.get("/admin/deployment/status");
};

export const getDeploymentHealth = () => {
  return API.get("/admin/deployment/health");
};

export const getMonitoringQueues = () => {
  return API.get("/admin/monitoring/queues");
};

export const getMonitoringDatabase = () => {
  return API.get("/admin/monitoring/database");
};

export const getMonitoringErrors = () => {
  return API.get("/admin/monitoring/errors");
};

export const getMonitoringLatency = () => {
  return API.get("/admin/monitoring/integrations/latency");
};

export const getApiLatency = () => {
  return API.get("/admin/monitoring/api-latency");
};

export const clearApiLatency = () => {
  return API.post("/admin/monitoring/api-latency/clear");
};

export const getCacheStats = () => {
  return API.get("/admin/monitoring/cache");
};

export const resetCacheStats = () => {
  return API.post("/admin/monitoring/cache/clear");
};

export const getBackupStatus = () => {
  return API.get("/admin/backups/status/latest");
};

export const listBackupRecords = (params = {}) => {
  return API.get(`/admin/backups${buildQueryString(params)}`);
};

export const getBackupRecord = (id) => {
  return API.get(`/admin/backups/${id}`);
};

export const createBackup = (data) => {
  return API.post("/admin/backups", data);
};

export const updateBackup = (id, data) => {
  return API.patch(`/admin/backups/${id}`, data);
};

export const executeBackup = (id) => {
  return API.post(`/admin/backups/${id}/execute`);
};

export const restoreBackup = (id, dryRun) => {
  return API.post(`/admin/backups/${id}/restore`, { dryRun });
};

export const downloadBackup = (id) => {
  return API.get(`/admin/backups/${id}/download`, { responseType: "blob" });
};

export const scheduleBackup = (id, data) => {
  return API.patch(`/admin/backups/${id}/schedule`, data);
};

export const getScheduledBackups = () => {
  return API.get("/admin/backups/scheduled");
};

export const listAlertRules = (params = {}) => {
  return API.get(`/admin/alert-rules${buildQueryString(params)}`);
};

export const getAlertRule = (id) => {
  return API.get(`/admin/alert-rules/${id}`);
};

export const createAlertRule = (data) => {
  return API.post("/admin/alert-rules", data);
};

export const updateAlertRule = (id, data) => {
  return API.patch(`/admin/alert-rules/${id}`, data);
};

export const deleteAlertRule = (id) => {
  return API.delete(`/admin/alert-rules/${id}`);
};

export const listPenetrationTestReports = (params = {}) => {
  return API.get(`/admin/penetration-tests${buildQueryString(params)}`);
};

export const getPenetrationTestReport = (id) => {
  return API.get(`/admin/penetration-tests/${id}`);
};

export const createPenetrationTestReport = (data) => {
  return API.post("/admin/penetration-tests", data);
};

export const updatePenetrationTestReport = (id, data) => {
  return API.patch(`/admin/penetration-tests/${id}`, data);
};

export const deletePenetrationTestReport = (id) => {
  return API.delete(`/admin/penetration-tests/${id}`);
};

export const listInsuranceDocuments = (params = {}) => {
  return API.get(`/admin/insurance-documents${buildQueryString(params)}`);
};

export const getInsuranceDocument = (id) => {
  return API.get(`/admin/insurance-documents/${id}`);
};

export const createInsuranceDocument = (data) => {
  return API.post("/admin/insurance-documents", data);
};

export const updateInsuranceDocument = (id, data) => {
  return API.patch(`/admin/insurance-documents/${id}`, data);
};

export const deleteInsuranceDocument = (id) => {
  return API.delete(`/admin/insurance-documents/${id}`);
};

export const getMaintenanceMode = () => {
  return API.get("/admin/maintenance");
};

export const setMaintenanceMode = (data) => {
  return API.post("/admin/maintenance", data);
};

export const getMigrationStatus = () => {
  return API.get("/admin/migration/status");
};

export const listPostmortems = () => {
  return API.get("/admin/postmortems");
};

export const createPostmortem = (data) => {
  return API.post("/admin/postmortems", data);
};
