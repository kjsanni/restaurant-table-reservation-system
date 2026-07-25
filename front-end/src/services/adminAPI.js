import API from "./API";

const emailLogs = () => {
  return API.post("/admin/logs/email");
};

const getRecentActivity = (limit = 20) => {
  return API.get(`/admin/audit/recent?limit=${limit}`);
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

export default {
  emailLogs,
  getRecentActivity,
  listSupportTickets,
  listFailedPaymentAlerts,
  retryFailedPayment,
  resolveFailedPayment,
  listBackupRecords,
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
};
