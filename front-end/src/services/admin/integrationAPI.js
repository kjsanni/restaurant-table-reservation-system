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

export const getWebhookStatus = () => {
  return API.get("/admin/integrations/webhooks/status");
};

export const getThirdPartyStatus = () => {
  return API.get("/admin/integrations/third-party");
};

export const getWebhookRetries = () => {
  return API.get("/admin/integrations/webhooks/retries");
};

export const getWhatsAppAnalytics = () => {
  return API.get("/admin/integrations/whatsapp/analytics");
};

export const getWhatsAppCampaigns = () => {
  return API.get("/admin/integrations/whatsapp/campaigns");
};

export const getWhatsAppDeliveryFailures = (params = {}) => {
  return API.get("/admin/integrations/whatsapp/delivery-failures", { params });
};

export const getWhatsAppSupportTicketAnalytics = (params = {}) => {
  return API.get("/admin/support-tickets/whatsapp/analytics", { params });
};

export const getShaqExpressAnalytics = () => {
  return API.get("/admin/integrations/shaqexpress/analytics");
};

export const getShaqExpressOrderConversion = (params = {}) => {
  return API.get("/admin/shaqexpress/order-conversion", { params });
};

export const getUnifiedIntegrationEvents = () => {
  return API.get("/admin/integrations/events/unified");
};

export const getPaystackTransactions = (tenantId) => {
  return API.get(
    `/admin/integrations/paystack/transactions?tenantId=${tenantId}`
  );
};

export const getPaystackSettlements = (tenantId) => {
  return API.get(
    `/admin/integrations/paystack/settlements?tenantId=${tenantId}`
  );
};

export const getPaystackDisputes = (tenantId) => {
  return API.get(`/admin/integrations/paystack/disputes?tenantId=${tenantId}`);
};

export const getPaystackFeeAnalysis = (tenantId) => {
  return API.get(`/admin/integrations/paystack/fees?tenantId=${tenantId}`);
};

export const testPaystackKeys = (tenantId, { publicKey, secretKey }) => {
  return API.post(`/admin/tenants/${tenantId}/test-paystack`, {
    publicKey,
    secretKey,
  });
};

export const testShaqExpress = (tenantId, { identifier, secret }) => {
  return API.post(`/admin/tenants/${tenantId}/test-shaqexpress`, {
    identifier,
    secret,
  });
};

export const updateGateway = (tenantId, payload) => {
  return API.patch(`/admin/tenants/${tenantId}/gateway`, payload);
};

export const listErpnextTenants = (params = {}) => {
  return API.get("/admin/erpnext/tenants", { params });
};

export const getErpnextTenant = (id) => {
  return API.get(`/admin/erpnext/tenants/${id}/status`);
};

export const provisionErpnextModule = (id, module) => {
  return API.post(`/admin/erpnext/tenants/${id}/provision`, { module });
};

export const deprovisionErpnextModule = (id, module) => {
  return API.post(`/admin/erpnext/tenants/${id}/deprovision`, { module });
};

export const triggerErpnextSync = (id, data = {}) => {
  return API.post(`/admin/erpnext/tenants/${id}/sync`, data);
};

export const getErpnextSyncStatus = (id) => {
  return API.get(`/admin/erpnext/tenants/${id}/sync/status`);
};
