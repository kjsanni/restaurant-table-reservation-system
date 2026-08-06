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

export const listPlatformRefunds = (params = {}) => {
  return API.get(`/admin/financial/refunds${buildQueryString(params)}`);
};

export const updateRefundStatus = (id, status) => {
  return API.patch(`/admin/financial/refunds/${id}/status`, { status });
};

export const getSubscriptionHealth = () => {
  return API.get("/admin/financial/subscription-health");
};

export const getFinancialAnomalies = (params = {}) => {
  return API.get("/admin/financial/anomalies", { params });
};

export const getPaystackConfig = () => {
  return API.get("/admin/paystack/config");
};

export const rotatePaystackKey = (data) => {
  return API.post("/admin/paystack/config/rotate", data);
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

export const getMultiCurrencyTotals = (params = {}) => {
  return API.get("/admin/reconciliation/multi-currency/totals", { params });
};

export const getTenantCurrencyBreakdown = (params = {}) => {
  return API.get("/admin/reconciliation/multi-currency/tenants", { params });
};
