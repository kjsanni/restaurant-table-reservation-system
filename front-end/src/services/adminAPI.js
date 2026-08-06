import API from "./API";

const emailLogs = () => {
  return API.post("/admin/logs/email");
};

const getRecentActivity = (limit = 20) => {
  return API.get(`/admin/audit/recent?limit=${limit}`);
};

const getAuditLogs = (params = {}) => {
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

const getPlatformAuditLog = (params = {}) => {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.tenantId) query.set("tenantId", params.tenantId);
  if (params.actorUserId) query.set("actorUserId", params.actorUserId);
  if (params.limit) query.set("limit", params.limit);
  if (params.offset) query.set("offset", params.offset);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return API.get(`/admin/audit${qs ? `?${qs}` : ""}`);
};

const getPlatformAuditLogForUser = (userId, params = {}) => {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.limit) query.set("limit", params.limit);
  if (params.offset) query.set("offset", params.offset);
  const qs = query.toString();
  return API.get(`/admin/audit/user/${userId}${qs ? `?${qs}` : ""}`);
};

const getPlatformAuditLogForTenant = (tenantId, params = {}) => {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.limit) query.set("limit", params.limit);
  if (params.offset) query.set("offset", params.offset);
  const qs = query.toString();
  return API.get(`/admin/audit/tenant/${tenantId}${qs ? `?${qs}` : ""}`);
};

const getSuspiciousActivity = (params = {}) => {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  return API.get(`/admin/audit/suspicious${qs ? `?${qs}` : ""}`);
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

const submitCsat = (id, data) => {
  return API.post(`/admin/support-chat/conversations/${id}/csat`, data);
};

const listSupportNotes = (conversationId, ticketId) => {
  const qs = [];
  if (conversationId) qs.push(`conversationId=${conversationId}`);
  if (ticketId) qs.push(`ticketId=${ticketId}`);
  return API.get(`/admin/support-notes${qs.length ? `?${qs.join("&")}` : ""}`);
};

const createSupportNote = (data) => {
  return API.post("/admin/support-notes", data);
};

const deleteSupportNote = (id) => {
  return API.delete(`/admin/support-notes/${id}`);
};

const listSupportAttachments = (conversationId, ticketId) => {
  const qs = [];
  if (conversationId) qs.push(`conversationId=${conversationId}`);
  if (ticketId) qs.push(`ticketId=${ticketId}`);
  return API.get(
    `/admin/support-attachments${qs.length ? `?${qs.join("&")}` : ""}`
  );
};

const createSupportAttachment = (data) => {
  return API.post("/admin/support-attachments", data);
};

const deleteSupportAttachment = (id) => {
  return API.delete(`/admin/support-attachments/${id}`);
};

const listComplianceRules = (vertical) => {
  const qs = vertical ? `?vertical=${vertical}` : "";
  return API.get(`/admin/compliance-rules${qs}`);
};

const createComplianceRule = (data) => {
  return API.post("/admin/compliance-rules", data);
};

const updateComplianceRule = (id, data) => {
  return API.patch(`/admin/compliance-rules/${id}`, data);
};

const deleteComplianceRule = (id) => {
  return API.delete(`/admin/compliance-rules/${id}`);
};

const listNotificationTemplates = (channel) => {
  const qs = channel ? `?channel=${channel}` : "";
  return API.get(`/admin/notification-templates${qs}`);
};

const createNotificationTemplate = (data) => {
  return API.post("/admin/notification-templates", data);
};

const updateNotificationTemplate = (id, data) => {
  return API.patch(`/admin/notification-templates/${id}`, data);
};

const deleteNotificationTemplate = (id) => {
  return API.delete(`/admin/notification-templates/${id}`);
};

const listAnnouncements = (channel) => {
  const qs = channel ? `?channel=${channel}` : "";
  return API.get(`/admin/announcements${qs}`);
};

const createAnnouncement = (data) => {
  return API.post("/admin/announcements", data);
};

const updateAnnouncement = (id, data) => {
  return API.patch(`/admin/announcements/${id}`, data);
};

const deleteAnnouncement = (id) => {
  return API.delete(`/admin/announcements/${id}`);
};

const listDataRetentionPolicies = () => {
  return API.get("/admin/data-retention/policies");
};

const createDataRetentionPolicy = (data) => {
  return API.post("/admin/data-retention/policies", data);
};

const updateDataRetentionPolicy = (id, data) => {
  return API.patch(`/admin/data-retention/policies/${id}`, data);
};

const deleteDataRetentionPolicy = (id) => {
  return API.delete(`/admin/data-retention/policies/${id}`);
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

const listEncryptionKeys = (params = {}) => {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", params.limit);
  return API.get(
    `/admin/encryption-keys${query.toString() ? `?${query}` : ""}`
  );
};

const getEncryptionKey = (id) => {
  return API.get(`/admin/encryption-keys/${id}`);
};

const createEncryptionKey = (data) => {
  return API.post("/admin/encryption-keys", data);
};

const rotateEncryptionKey = (id, data) => {
  return API.post(`/admin/encryption-keys/${id}/rotate`, data);
};

const retireEncryptionKey = (id) => {
  return API.post(`/admin/encryption-keys/${id}/retire`);
};

const deleteEncryptionKey = (id) => {
  return API.delete(`/admin/encryption-keys/${id}`);
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

const getFlagAuditLog = (tenantId) => {
  return API.get(`/admin/feature-flags/tenants/${tenantId}/audit-log`);
};

const bulkCategoryAction = (tenantId, category, action) => {
  return API.post(`/admin/feature-flags/tenants/${tenantId}/bulk`, {
    category,
    action,
  });
};

const resetTenantFlags = (tenantId) => {
  return API.post(`/admin/feature-flags/tenants/${tenantId}/reset`);
};

const createFlagPreset = (data) => {
  return API.post("/admin/feature-flags/presets", data);
};

const listFlagPresets = () => {
  return API.get("/admin/feature-flags/presets");
};

const applyFlagPreset = (tenantId, presetId) => {
  return API.post(`/admin/feature-flags/presets/${presetId}/apply/${tenantId}`);
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

const testPaystackKeys = (tenantId, { publicKey, secretKey }) => {
  return API.post(`/admin/tenants/${tenantId}/test-paystack`, {
    publicKey,
    secretKey,
  });
};

const testShaqExpress = (tenantId, { identifier, secret }) => {
  return API.post(`/admin/tenants/${tenantId}/test-shaqexpress`, {
    identifier,
    secret,
  });
};

const updateGateway = (tenantId, payload) => {
  return API.patch(`/admin/tenants/${tenantId}/gateway`, payload);
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

const getWhatsAppDeliveryFailures = (params = {}) => {
  return API.get("/admin/integrations/whatsapp/delivery-failures", { params });
};

const getShaqExpressOrderConversion = (params = {}) => {
  return API.get("/admin/shaqexpress/order-conversion", { params });
};

const getWhatsAppSupportTicketAnalytics = (params = {}) => {
  return API.get("/admin/support-tickets/whatsapp/analytics", { params });
};

const listMarketplaceListings = () => {
  return API.get("/admin/marketplace/listings");
};

const createMarketplaceListing = (data) => {
  return API.post("/admin/marketplace/listings", data);
};

const updateMarketplaceListing = (id, data) => {
  return API.patch(`/admin/marketplace/listings/${id}`, data);
};

const removeMarketplaceListing = (id) => {
  return API.delete(`/admin/marketplace/listings/${id}`);
};

const listCaseStudies = () => {
  return API.get("/admin/case-studies");
};

const createCaseStudy = (data) => {
  return API.post("/admin/case-studies", data);
};

const updateCaseStudy = (id, data) => {
  return API.patch(`/admin/case-studies/${id}`, data);
};

const removeCaseStudy = (id) => {
  return API.delete(`/admin/case-studies/${id}`);
};

const listPlatformReferrals = () => {
  return API.get("/admin/referrals");
};

const createPlatformReferral = (data) => {
  return API.post("/admin/referrals", data);
};

const updatePlatformReferral = (id, data) => {
  return API.patch(`/admin/referrals/${id}`, data);
};

const crossTenantSearch = (params = {}) => {
  return API.get("/admin/search", { params });
};

const listPlatformReports = () => {
  return API.get("/admin/platform-reports");
};

const createPlatformReport = (data) => {
  return API.post("/admin/platform-reports", data);
};

const getPlatformReport = (id) => {
  return API.get(`/admin/platform-reports/${id}`);
};

const downloadPlatformReport = (id) => {
  return API.get(`/admin/platform-reports/${id}/download`, {
    responseType: "blob",
  });
};

const deletePlatformReport = (id) => {
  return API.delete(`/admin/platform-reports/${id}`);
};

const getPaystackConfig = () => {
  return API.get("/admin/paystack/config");
};

const rotatePaystackKey = (data) => {
  return API.post("/admin/paystack/config/rotate", data);
};

const getMultiCurrencyTotals = (params = {}) => {
  return API.get("/admin/reconciliation/multi-currency/totals", { params });
};

const getTenantCurrencyBreakdown = (params = {}) => {
  return API.get("/admin/reconciliation/multi-currency/tenants", { params });
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

const listPlatformSettings = () => {
  return API.get("/admin/platform-settings");
};

const updatePlatformSetting = (key, value) => {
  return API.put("/admin/platform-settings", { key, value });
};

const listPlatformSettingChanges = () => {
  return API.get("/admin/platform-settings/audit");
};

const listSessions = () => {
  return API.get("/admin/sessions");
};

const revokeSession = (id) => {
  return API.delete(`/admin/sessions/${id}`);
};

const revokeAllSessions = () => {
  return API.post("/admin/sessions/revoke-all");
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

const getCacheStats = () => {
  return API.get("/admin/monitoring/cache");
};

const resetCacheStats = () => {
  return API.post("/admin/monitoring/cache/clear");
};

const listVerticalTemplates = () => {
  return API.get("/admin/vertical-templates");
};

const createVerticalTemplate = (data) => {
  return API.post("/admin/vertical-templates", data);
};

const updateVerticalTemplate = (id, data) => {
  return API.patch(`/admin/vertical-templates/${id}`, data);
};

const deleteVerticalTemplate = (id) => {
  return API.delete(`/admin/vertical-templates/${id}`);
};

const getVerticalAnalytics = () => {
  return API.get("/admin/vertical-analytics");
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

const lockTenant = (tenantId) => {
  return API.post(`/admin/incidents/${tenantId}/lock-tenant`);
};

const resetTenantTokens = (tenantId) => {
  return API.post(`/admin/incidents/${tenantId}/reset-tokens`);
};

const forceLogoutTenant = (tenantId) => {
  return API.post(`/admin/incidents/${tenantId}/force-logout`);
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

const scheduleBackup = (id, data) => {
  return API.patch(`/admin/backups/${id}/schedule`, data);
};

const getScheduledBackups = () => {
  return API.get("/admin/backups/scheduled");
};

const listAlertRules = (params = {}) => {
  const query = new URLSearchParams();
  if (params.isActive !== undefined) query.set("isActive", params.isActive);
  if (params.metric) query.set("metric", params.metric);
  if (params.limit) query.set("limit", params.limit);
  return API.get(`/admin/alert-rules${query.toString() ? `?${query}` : ""}`);
};

const getAlertRule = (id) => {
  return API.get(`/admin/alert-rules/${id}`);
};

const createAlertRule = (data) => {
  return API.post("/admin/alert-rules", data);
};

const updateAlertRule = (id, data) => {
  return API.patch(`/admin/alert-rules/${id}`, data);
};

const deleteAlertRule = (id) => {
  return API.delete(`/admin/alert-rules/${id}`);
};

const listPenetrationTestReports = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", params.limit);
  return API.get(
    `/admin/penetration-tests${query.toString() ? `?${query}` : ""}`
  );
};

const getPenetrationTestReport = (id) => {
  return API.get(`/admin/penetration-tests/${id}`);
};

const createPenetrationTestReport = (data) => {
  return API.post("/admin/penetration-tests", data);
};

const updatePenetrationTestReport = (id, data) => {
  return API.patch(`/admin/penetration-tests/${id}`, data);
};

const deletePenetrationTestReport = (id) => {
  return API.delete(`/admin/penetration-tests/${id}`);
};

const listInsuranceDocuments = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", params.limit);
  return API.get(
    `/admin/insurance-documents${query.toString() ? `?${query}` : ""}`
  );
};

const getInsuranceDocument = (id) => {
  return API.get(`/admin/insurance-documents/${id}`);
};

const createInsuranceDocument = (data) => {
  return API.post("/admin/insurance-documents", data);
};

const updateInsuranceDocument = (id, data) => {
  return API.patch(`/admin/insurance-documents/${id}`, data);
};

const deleteInsuranceDocument = (id) => {
  return API.delete(`/admin/insurance-documents/${id}`);
};

const exportTenantMigration = (tenantId) => {
  return API.get(`/admin/tenants/${tenantId}/migration/export`);
};

const importTenantMigration = (payload) => {
  return API.post("/admin/tenants/migration/import", payload);
};

const listAutoScalingTriggers = (params = {}) => {
  const query = new URLSearchParams();
  if (params.metric) query.set("metric", params.metric);
  if (params.isActive !== undefined)
    query.set("isActive", String(params.isActive));
  if (params.limit) query.set("limit", params.limit);
  return API.get(`/admin/auto-scaling${query.toString() ? `?${query}` : ""}`);
};

const getAutoScalingTrigger = (id) => {
  return API.get(`/admin/auto-scaling/${id}`);
};

const createAutoScalingTrigger = (data) => {
  return API.post("/admin/auto-scaling", data);
};

const updateAutoScalingTrigger = (id, data) => {
  return API.patch(`/admin/auto-scaling/${id}`, data);
};

const deleteAutoScalingTrigger = (id) => {
  return API.delete(`/admin/auto-scaling/${id}`);
};

const listComplianceEvidence = (params = {}) => {
  const query = new URLSearchParams();
  if (params.framework) query.set("framework", params.framework);
  if (params.status) query.set("status", params.status);
  if (params.controlId) query.set("controlId", params.controlId);
  if (params.limit) query.set("limit", params.limit);
  return API.get(`/admin/compliance${query.toString() ? `?${query}` : ""}`);
};

const getComplianceEvidence = (id) => {
  return API.get(`/admin/compliance/${id}`);
};

const createComplianceEvidence = (data) => {
  return API.post("/admin/compliance", data);
};

const updateComplianceEvidence = (id, data) => {
  return API.patch(`/admin/compliance/${id}`, data);
};

const deleteComplianceEvidence = (id) => {
  return API.delete(`/admin/compliance/${id}`);
};

const listPlatformRoles = () => {
  return API.get("/admin/platform/roles");
};

const getUsers = () => {
  return API.get("/auth/users");
};

const assignPlatformRole = (userId, role) => {
  return API.post("/admin/platform/roles/assign", { userId, role });
};

const revokePlatformRole = (userId, role) => {
  return API.post("/admin/platform/roles/revoke", { userId, role });
};

const requestBreakGlass = (justification, durationMinutes) => {
  return API.post("/admin/break-glass/request", {
    justification,
    durationMinutes,
  });
};

const approveBreakGlass = (requestId, notes) => {
  return API.post(`/admin/break-glass/approve/${requestId}`, { notes });
};

const denyBreakGlass = (requestId, notes) => {
  return API.post(`/admin/break-glass/deny/${requestId}`, { notes });
};

const revokeBreakGlass = (requestId) => {
  return API.post(`/admin/break-glass/revoke/${requestId}`);
};

const listBreakGlassRequests = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return API.get(`/admin/break-glass/requests${qs ? `?${qs}` : ""}`);
};

const listMyBreakGlassRequests = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return API.get(`/admin/break-glass/my-requests${qs ? `?${qs}` : ""}`);
};

const expireBreakGlass = () => {
  return API.post("/admin/break-glass/expire");
};

export default {
  emailLogs,
  exportAuditLog,
  getAuditLogs,
  getRecentActivity,
  getPlatformAuditLog,
  getPlatformAuditLogForUser,
  getPlatformAuditLogForTenant,
  getSuspiciousActivity,
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
  scheduleBackup,
  getScheduledBackups,
  getBackupStatus,
  listAlertRules,
  getAlertRule,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
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
  submitCsat,
  listSupportNotes,
  createSupportNote,
  deleteSupportNote,
  listSupportAttachments,
  createSupportAttachment,
  deleteSupportAttachment,
  listComplianceRules,
  createComplianceRule,
  updateComplianceRule,
  deleteComplianceRule,
  listNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listDataRetentionPolicies,
  createDataRetentionPolicy,
  updateDataRetentionPolicy,
  deleteDataRetentionPolicy,
  listSubProcessors,
  createSubProcessor,
  updateSubProcessor,
  deleteSubProcessor,
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
  getFlagAuditLog,
  bulkCategoryAction,
  resetTenantFlags,
  createFlagPreset,
  listFlagPresets,
  applyFlagPreset,
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
  listPlatformSettings,
  updatePlatformSetting,
  listPlatformSettingChanges,
  listSessions,
  revokeSession,
  revokeAllSessions,
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
  getCacheStats,
  resetCacheStats,
  listVerticalTemplates,
  createVerticalTemplate,
  updateVerticalTemplate,
  deleteVerticalTemplate,
  getVerticalAnalytics,
  executeDataRetention,
  listIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  lockTenant,
  resetTenantTokens,
  forceLogoutTenant,
  getSuspiciousActivity,
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
  listPlatformReports,
  createPlatformReport,
  getPlatformReport,
  downloadPlatformReport,
  deletePlatformReport,
  getMultiCurrencyTotals,
  getTenantCurrencyBreakdown,
  getPaystackConfig,
  rotatePaystackKey,
  getWhatsAppDeliveryFailures,
  getShaqExpressOrderConversion,
  getWhatsAppSupportTicketAnalytics,
  listMarketplaceListings,
  createMarketplaceListing,
  updateMarketplaceListing,
  removeMarketplaceListing,
  listCaseStudies,
  createCaseStudy,
  updateCaseStudy,
  removeCaseStudy,
  listPlatformReferrals,
  createPlatformReferral,
  updatePlatformReferral,
  crossTenantSearch,
  listPenetrationTestReports,
  getPenetrationTestReport,
  createPenetrationTestReport,
  updatePenetrationTestReport,
  deletePenetrationTestReport,
  listInsuranceDocuments,
  getInsuranceDocument,
  createInsuranceDocument,
  updateInsuranceDocument,
  deleteInsuranceDocument,
  exportTenantMigration,
  importTenantMigration,
  listEncryptionKeys,
  getEncryptionKey,
  createEncryptionKey,
  rotateEncryptionKey,
  retireEncryptionKey,
  deleteEncryptionKey,
  listAutoScalingTriggers,
  getAutoScalingTrigger,
  createAutoScalingTrigger,
  updateAutoScalingTrigger,
  deleteAutoScalingTrigger,
  listComplianceEvidence,
  getComplianceEvidence,
  createComplianceEvidence,
  updateComplianceEvidence,
  deleteComplianceEvidence,
  listPlatformRoles,
  getUsers,
  assignPlatformRole,
  revokePlatformRole,
  requestBreakGlass,
  approveBreakGlass,
  denyBreakGlass,
  revokeBreakGlass,
  listBreakGlassRequests,
  listMyBreakGlassRequests,
  expireBreakGlass,
  setupTOTP: () => API.post("/admin/totp/setup"),
  confirmTOTP: (token) => API.post("/admin/totp/confirm", { token }),
  disableTOTP: () => API.post("/admin/totp/disable"),
  getTOTPStatus: () => API.get("/admin/totp/status"),
  regenerateBackupCodes: () => API.post("/admin/totp/backup-codes/regenerate"),
  verifyBackupCode: (code) =>
    API.post("/admin/totp/backup-codes/verify", { code }),
  listErpnextTenants: (params = {}) =>
    API.get("/admin/erpnext/tenants", { params }),
  getErpnextTenant: (id) => API.get(`/admin/erpnext/tenants/${id}/status`),
  provisionErpnextModule: (id, module) =>
    API.post(`/admin/erpnext/tenants/${id}/provision`, { module }),
  deprovisionErpnextModule: (id, module) =>
    API.post(`/admin/erpnext/tenants/${id}/deprovision`, { module }),
  triggerErpnextSync: (id, data = {}) =>
    API.post(`/admin/erpnext/tenants/${id}/sync`, data),
  getErpnextSyncStatus: (id) =>
    API.get(`/admin/erpnext/tenants/${id}/sync/status`),
  testPaystackKeys,
  testShaqExpress,
  updateGateway,
};
