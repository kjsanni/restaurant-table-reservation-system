import API from "./API";

const emailLogs = () => {
  return API.post("/admin/logs/email");
};

const getRecentActivity = (limit = 20) => {
  return API.get(`/admin/audit/recent?limit=${limit}`);
};

const exportAuditLog = (params = {}) => {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.tenantId) query.set("tenantId", params.tenantId);
  if (params.actorUserId) query.set("actorUserId", params.actorUserId);
  if (params.format) query.set("format", params.format);
  const qs = query.toString();
  return API.get(`/admin/audit/export${qs ? `?${qs}` : ""}`, {
    responseType: "blob",
  });
};

const listSupportTickets = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  return API.get(`/admin/support-tickets${qs ? `?${qs}` : ""}`);
};

const listFailedPaymentAlerts = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.gateway) query.set("gateway", params.gateway);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  return API.get(`/admin/payment-alerts${qs ? `?${qs}` : ""}`);
};

const retryFailedPayment = (id) => {
  return API.post(`/admin/payment-alerts/${id}/retry`);
};

const resolveFailedPayment = (id) => {
  return API.post(`/admin/payment-alerts/${id}/resolve`);
};

const listBackupRecords = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  return API.get(`/admin/backups${qs ? `?${qs}` : ""}`);
};

const getBackupStatus = () => {
  return API.get("/admin/backups/status/latest");
};

const getDeploymentStatus = () => {
  return API.get("/admin/deployment/status");
};

const getDeploymentHealth = () => {
  return API.get("/admin/deployment/health");
};

const getBruteForceAggregation = () => {
  return API.get("/admin/security/brute-force-aggregation");
};

const getComplianceScorecard = () => {
  return API.get("/admin/compliance/scorecard");
};

const listSupportConversations = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.assignedTo) query.set("assignedTo", params.assignedTo);
  const qs = query.toString();
  return API.get(`/admin/support-chat/conversations${qs ? `?${qs}` : ""}`);
};

const getSupportConversation = (id) => {
  return API.get(`/admin/support-chat/conversations/${id}`);
};

const createSupportConversation = (data) => {
  return API.post("/admin/support-chat/conversations", data);
};

const updateSupportConversation = (id, data) => {
  return API.patch(`/admin/support-chat/conversations/${id}`, data);
};

const listSupportMessages = (conversationId) => {
  return API.get(
    `/admin/support-chat/conversations/${conversationId}/messages`
  );
};

const sendSupportMessage = (conversationId, body) => {
  return API.post(
    `/admin/support-chat/conversations/${conversationId}/messages`,
    { body }
  );
};

const deleteSupportConversation = (id) => {
  return API.delete(`/admin/support-chat/conversations/${id}`);
};

const autoAssignConversation = (id) => {
  return API.post(`/admin/support-chat/conversations/${id}/auto-assign`);
};

const deleteSupportTicket = (id) => {
  return API.delete(`/admin/support-tickets/${id}`);
};

const updateSupportTicket = (id, data) => {
  return API.patch(`/admin/support-tickets/${id}`, data);
};

const getSupportTicket = (id) => {
  return API.get(`/admin/support-tickets/${id}`);
};

const listSupportTemplates = () => {
  return API.get("/admin/support-templates");
};

const createSupportTemplate = (data) => {
  return API.post("/admin/support-templates", data);
};

const updateSupportTemplate = (id, data) => {
  return API.patch(`/admin/support-templates/${id}`, data);
};

const deleteSupportTemplate = (id) => {
  return API.delete(`/admin/support-templates/${id}`);
};

const bulkEnableTenants = (tenantIds) => {
  return API.post("/admin/bulk/enable", { tenantIds });
};

const bulkExportTenants = (tenantIds) => {
  return API.post("/admin/bulk/export", { tenantIds });
};

const bulkAssignFeatureFlags = (tenantIds, featureFlags) => {
  return API.post("/admin/bulk/feature-flags", { tenantIds, featureFlags });
};

const bulkDeleteTenants = (tenantIds) => {
  return API.post("/admin/bulk/delete", { tenantIds });
};

const listFeatureFlags = () => {
  return API.get("/admin/feature-flags");
};

const getTenantFeatureFlags = (id) => {
  return API.get(`/admin/feature-flags/tenants/${id}`);
};

const updateTenantFeatureFlags = (id, featureFlags) => {
  return API.patch(`/admin/feature-flags/tenants/${id}`, { featureFlags });
};

const getGlobalFeatureFlags = () => {
  return API.get("/admin/feature-flags/global");
};

const updateGlobalFeatureFlags = (flags) => {
  return API.put("/admin/feature-flags/global", { flags });
};

const toggleSalonModule = (id, enabled) => {
  return API.post(`/admin/feature-flags/tenants/${id}/salon-module`, {
    enabled,
  });
};

const listPlatformRefunds = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.tenantId) query.set("tenantId", params.tenantId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  return API.get(`/admin/financial/refunds${qs ? `?${qs}` : ""}`);
};

const updateRefundStatus = (id, status) => {
  return API.patch(`/admin/financial/refunds/${id}/status`, { status });
};

const getSubscriptionHealth = () => {
  return API.get("/admin/financial/subscription-health");
};

const getFinancialAnomalies = (params = {}) => {
  return API.get("/admin/financial/anomalies", { params });
};

const getPaystackTransactions = (tenantId) => {
  return API.get(
    `/admin/integrations/paystack/transactions?tenantId=${tenantId}`
  );
};

const getPaystackSettlements = (tenantId) => {
  return API.get(
    `/admin/integrations/paystack/settlements?tenantId=${tenantId}`
  );
};

const getWebhookStatus = () => {
  return API.get("/admin/integrations/webhooks/status");
};

const getThirdPartyStatus = () => {
  return API.get("/admin/integrations/third-party");
};

const getPaystackDisputes = (tenantId) => {
  return API.get(`/admin/integrations/paystack/disputes?tenantId=${tenantId}`);
};

const getPaystackFeeAnalysis = (tenantId) => {
  return API.get(`/admin/integrations/paystack/fees?tenantId=${tenantId}`);
};

const getWebhookRetries = () => {
  return API.get("/admin/integrations/webhooks/retries");
};

const getWhatsAppAnalytics = () => {
  return API.get("/admin/integrations/whatsapp/analytics");
};

const getWhatsAppCampaigns = () => {
  return API.get("/admin/integrations/whatsapp/campaigns");
};

const getShaqExpressAnalytics = () => {
  return API.get("/admin/integrations/shaqexpress/analytics");
};

const getUnifiedIntegrationEvents = () => {
  return API.get("/admin/integrations/events/unified");
};

const startImpersonation = (data) => {
  return API.post("/admin/impersonation", data);
};

const endImpersonation = (id) => {
  return API.post(`/admin/impersonation/${id}/end`);
};

const listImpersonation = () => {
  return API.get("/admin/impersonation");
};

const getTenantGrowth = () => {
  return API.get("/admin/analytics/growth");
};

const getChurnAnalysis = (params = {}) => {
  const query = new URLSearchParams();
  if (params.plan) query.set("plan", params.plan);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  return API.get(`/admin/analytics/churn${qs ? `?${qs}` : ""}`);
};

const getLtvCac = () => {
  return API.get("/admin/analytics/ltv-cac");
};

const getMaintenanceMode = () => {
  return API.get("/admin/maintenance");
};

const setMaintenanceMode = (data) => {
  return API.post("/admin/maintenance", data);
};

const getTenantHealthScores = () => {
  return API.get("/admin/trust-safety/health-scores");
};

const getMonitoringQueues = () => {
  return API.get("/admin/monitoring/queues");
};

const getMonitoringDatabase = () => {
  return API.get("/admin/monitoring/database");
};

const getMonitoringErrors = () => {
  return API.get("/admin/monitoring/errors");
};

const getMonitoringLatency = () => {
  return API.get("/admin/monitoring/integrations/latency");
};

const getApiLatency = () => {
  return API.get("/admin/monitoring/api-latency");
};

const clearApiLatency = () => {
  return API.post("/admin/monitoring/api-latency/clear");
};

const getVerticalAnalytics = () => {
  return API.get("/admin/vertical-analytics");
};

const listDataRetentionPolicies = () => {
  return API.get("/admin/data-retention");
};

const createDataRetentionPolicy = (data) => {
  return API.post("/admin/data-retention", data);
};

const updateDataRetentionPolicy = (id, data) => {
  return API.patch(`/admin/data-retention/${id}`, data);
};

const deleteDataRetentionPolicy = (id) => {
  return API.delete(`/admin/data-retention/${id}`);
};

const executeDataRetention = () => {
  return API.post("/admin/data-retention/execute");
};

const listIncidents = () => {
  return API.get("/admin/incidents");
};

const createIncident = (data) => {
  return API.post("/admin/incidents", data);
};

const updateIncident = (id, data) => {
  return API.patch(`/admin/incidents/${id}`, data);
};

const deleteIncident = (id) => {
  return API.delete(`/admin/incidents/${id}`);
};

const getSuspiciousActivity = () => {
  return API.get("/admin/suspicious-activity");
};

const listSubProcessors = () => {
  return API.get("/admin/sub-processors");
};

const createSubProcessor = (data) => {
  return API.post("/admin/sub-processors", data);
};

const updateSubProcessor = (id, data) => {
  return API.patch(`/admin/sub-processors/${id}`, data);
};

const deleteSubProcessor = (id) => {
  return API.delete(`/admin/sub-processors/${id}`);
};

const getTenantDebug = (tenantId) => {
  return API.get(`/admin/debug/tenant/${tenantId}`);
};

const getPlatformDebug = () => {
  return API.get("/admin/debug/platform");
};

const getMigrationStatus = () => {
  return API.get("/admin/migration/status");
};

const listPostmortems = () => {
  return API.get("/admin/postmortems");
};

const createPostmortem = (data) => {
  return API.post("/admin/postmortems", data);
};

const getBackupRecord = (id) => {
  return API.get(`/admin/backups/${id}`);
};

const createBackup = (data) => {
  return API.post("/admin/backups", data);
};

const updateBackup = (id, data) => {
  return API.patch(`/admin/backups/${id}`, data);
};

const executeBackup = (id) => {
  return API.post(`/admin/backups/${id}/execute`);
};

const restoreBackup = (id, dryRun) => {
  return API.post(`/admin/backups/${id}/restore`, { dryRun });
};

const downloadBackup = (id) => {
  return API.get(`/admin/backups/${id}/download`, { responseType: "blob" });
};

export default {
  emailLogs,
  exportAuditLog,
  getRecentActivity,
  listSupportTickets,
  listFailedPaymentAlerts,
  retryFailedPayment,
  resolveFailedPayment,
  listBackupRecords,
  getBackupRecord,
  createBackup,
  updateBackup,
  executeBackup,
  restoreBackup,
  downloadBackup,
  getBackupStatus,
  getDeploymentStatus,
  getDeploymentHealth,
  getBruteForceAggregation,
  getComplianceScorecard,
  listSupportConversations,
  getSupportConversation,
  createSupportConversation,
  updateSupportConversation,
  listSupportMessages,
  sendSupportMessage,
  deleteSupportConversation,
  autoAssignConversation,
  deleteSupportTicket,
  updateSupportTicket,
  getSupportTicket,
  listSupportTemplates,
  createSupportTemplate,
  updateSupportTemplate,
  deleteSupportTemplate,
  bulkEnableTenants,
  bulkExportTenants,
  bulkAssignFeatureFlags,
  bulkDeleteTenants,
  listFeatureFlags,
  getTenantFeatureFlags,
  updateTenantFeatureFlags,
  getGlobalFeatureFlags,
  updateGlobalFeatureFlags,
  toggleSalonModule,
  listPlatformRefunds,
  updateRefundStatus,
  getSubscriptionHealth,
  getFinancialAnomalies,
  getPaystackTransactions,
  getPaystackSettlements,
  getWebhookStatus,
  getThirdPartyStatus,
  startImpersonation,
  endImpersonation,
  listImpersonation,
  getTenantGrowth,
  getChurnAnalysis,
  getLtvCac,
  getMaintenanceMode,
  setMaintenanceMode,
  getTenantHealthScores,
  getMonitoringQueues,
  getMonitoringDatabase,
  getMonitoringErrors,
  getMonitoringLatency,
  getApiLatency,
  clearApiLatency,
  getVerticalAnalytics,
  listDataRetentionPolicies,
  createDataRetentionPolicy,
  updateDataRetentionPolicy,
  deleteDataRetentionPolicy,
  executeDataRetention,
  listIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getSuspiciousActivity,
  listSubProcessors,
  createSubProcessor,
  updateSubProcessor,
  deleteSubProcessor,
  getTenantDebug,
  getPlatformDebug,
  getMigrationStatus,
  listPostmortems,
  createPostmortem,
  getPaystackDisputes,
  getPaystackFeeAnalysis,
  getWebhookRetries,
  getWhatsAppAnalytics,
  getWhatsAppCampaigns,
  getShaqExpressAnalytics,
  getUnifiedIntegrationEvents,
};
