const axios = require("axios");
const deliveryDAO = require("../DAOs/delivery.dao");
const db = require("../db/models");
const logger = require("../utils/logger");

const SHAQ_BASE_URL = "https://public-api.shaqexpress.com/api/v1";

let cachedToken = null;
let tokenExpiry = null;

const getCredentials = async (tenantId) => {
  const where = tenantId ? { key: "shaqexpress_config", tenantId } : { key: "shaqexpress_config" };
  const setting = await db.setting.findOne({ where });
  if (!setting || !setting.value) {
    throw new Error("Shaq Express is not configured.");
  }
  const cfg = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
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

  const response = await axios.post(`${SHAQ_BASE_URL}/auth/login`, {
    identifier,
    secret,
  });

  cachedToken = response.data?.data?.token;
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
  const response = await axios.post(`${SHAQ_BASE_URL}/packages`, packageData, { headers });
  return response.data;
};

const getPackage = async (tenantId, partnerRef) => {
  const headers = await authHeaders(tenantId);
  const response = await axios.get(`${SHAQ_BASE_URL}/packages/${encodeURIComponent(partnerRef)}`, { headers });
  return response.data;
};

const trackPackage = async (tenantId, trackingNumber) => {
  const headers = await authHeaders(tenantId);
  const response = await axios.get(`${SHAQ_BASE_URL}/tracking/${encodeURIComponent(trackingNumber)}`, { headers });
  return response.data;
};

const getRegions = async (tenantId) => {
  const headers = await authHeaders(tenantId);
  const response = await axios.get(`${SHAQ_BASE_URL}/setup/regions`, { headers });
  return response.data;
};

const cancelPackage = async (tenantId, partnerRef) => {
  const headers = await authHeaders(tenantId);
  const response = await axios.post(`${SHAQ_BASE_URL}/packages/${encodeURIComponent(partnerRef)}/cancel`, {}, { headers });
  return response.data;
};

const updatePackage = async (tenantId, partnerRef, updates) => {
  const headers = await authHeaders(tenantId);
  const response = await axios.patch(`${SHAQ_BASE_URL}/packages/${encodeURIComponent(partnerRef)}`, updates, { headers });
  return response.data;
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
