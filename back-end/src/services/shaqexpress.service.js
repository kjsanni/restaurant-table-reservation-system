const axios = require("axios");
const db = require("../db/models");
const { normalizeSettingValue } = require("../utils/settings");
const CircuitBreaker = require("../utils/circuitBreaker");

const SHAQ_BASE_URL = "https://public-api.shaqexpress.com/api/v1";

let cachedToken = null;
let tokenExpiry = null;

const getCredentials = async (tenantId) => {
  const where = tenantId ? { key: "shaqexpress_config", tenantId } : { key: "shaqexpress_config" };
  const setting = await db.setting.findOne({ where });
  if (!setting || !setting.value) {
    throw new Error("Shaq Express is not configured.");
  }
  const cfg = normalizeSettingValue(setting.value);
  return {
    identifier: cfg.identifier,
    secret: cfg.secret,
    enabled: Boolean(cfg.identifier && cfg.secret),
  };
};

const getAuthToken = async (tenantId) => {
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  const { identifier, secret, enabled } = await getCredentials(tenantId);
  if (!enabled) {
    throw new Error("Shaq Express is not configured.");
  }

  const response = await CircuitBreaker.execute(
    "shaqexpress",
    async () => {
      const res = await axios.post(`${SHAQ_BASE_URL}/auth/login`, {
        identifier,
        secret,
      }, { timeout: 10000 });
      return res.data;
    },
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );

  cachedToken = response?.data?.token;
  tokenExpiry = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
  return cachedToken;
};

const authHeaders = async (tenantId) => {
  const token = await getAuthToken(tenantId);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const createPackage = async (tenantId, packageData) => {
  const headers = await authHeaders(tenantId);
  const response = await CircuitBreaker.execute(
    "shaqexpress",
    () => axios.post(`${SHAQ_BASE_URL}/packages`, packageData, { headers, timeout: 10000 }).then((r) => r.data),
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
  return response;
};

const getPackage = async (tenantId, partnerRef) => {
  const headers = await authHeaders(tenantId);
  const response = await CircuitBreaker.execute(
    "shaqexpress",
    () => axios.get(`${SHAQ_BASE_URL}/packages/${encodeURIComponent(partnerRef)}`, { headers, timeout: 10000 }).then((r) => r.data),
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
  return response;
};

const trackPackage = async (tenantId, trackingNumber) => {
  const headers = await authHeaders(tenantId);
  const response = await CircuitBreaker.execute(
    "shaqexpress",
    () => axios.get(`${SHAQ_BASE_URL}/tracking/${encodeURIComponent(trackingNumber)}`, { headers, timeout: 10000 }).then((r) => r.data),
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
  return response;
};

const getRegions = async (tenantId) => {
  const headers = await authHeaders(tenantId);
  const response = await CircuitBreaker.execute(
    "shaqexpress",
    () => axios.get(`${SHAQ_BASE_URL}/setup/regions`, { headers, timeout: 10000 }).then((r) => r.data),
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
  return response;
};

const cancelPackage = async (tenantId, partnerRef) => {
  const headers = await authHeaders(tenantId);
  const response = await CircuitBreaker.execute(
    "shaqexpress",
    () => axios.post(`${SHAQ_BASE_URL}/packages/${encodeURIComponent(partnerRef)}/cancel`, {}, { headers, timeout: 10000 }).then((r) => r.data),
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
  return response;
};

const updatePackage = async (tenantId, partnerRef, updates) => {
  const headers = await authHeaders(tenantId);
  const response = await CircuitBreaker.execute(
    "shaqexpress",
    () => axios.patch(`${SHAQ_BASE_URL}/packages/${encodeURIComponent(partnerRef)}`, updates, { headers, timeout: 10000 }).then((r) => r.data),
    { failureThreshold: 5, recoveryTimeout: 30000 }
  );
  return response;
};

const verifyWebhookSignature = (payload, signature, secret) => {
  if (!secret || !signature) return false;
  const crypto = require("crypto");
  const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  return signature === expected;
};

module.exports = {
  createPackage,
  getPackage,
  trackPackage,
  getRegions,
  cancelPackage,
  updatePackage,
  getCredentials,
  verifyWebhookSignature,
};
