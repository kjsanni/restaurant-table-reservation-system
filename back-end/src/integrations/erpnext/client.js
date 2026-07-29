"use strict";

const axios = require("axios");
const { cache } = require("../../utils/cache");

const ERPNEXT_BASE_URL = process.env.ERPNEXT_BASE_URL || "";
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || "";
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || "";
const ERPNEXT_TIMEOUT = parseInt(process.env.ERPNEXT_TIMEOUT_MS || "30000", 10);
const CACHE_TTL = parseInt(process.env.ERPNEXT_CACHE_TTL || "300", 10);

let clientInstance = null;

const getClient = () => {
  if (clientInstance) return clientInstance;

  clientInstance = axios.create({
    baseURL: ERPNEXT_BASE_URL,
    timeout: ERPNEXT_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`).toString("base64")}`,
    },
  });

  clientInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        const err = new Error(`ERPNext API error: ${status} - ${message}`);
        err.status = status;
        err.erpnextError = true;
        throw err;
      }
      throw error;
    }
  );

  return clientInstance;
};

const get = async (path, params = {}, tenantId = null) => {
  const cacheKey = tenantId ? `erpnext:${tenantId}:${path}:${JSON.stringify(params)}` : null;
  if (cacheKey) {
    const cached = await cache.get(cacheKey);
    if (cached !== null) return cached;
  }

  const response = await getClient().get(path, { params });
  const data = response.data;

  if (cacheKey && data) {
    await cache.set(cacheKey, data, CACHE_TTL);
  }

  return data;
};

const post = async (path, body = {}, tenantId = null) => {
  const response = await getClient().post(path, body);
  return response.data;
};

const put = async (path, body = {}, tenantId = null) => {
  const response = await getClient().put(path, body);
  return response.data;
};

const del = async (path, tenantId = null) => {
  const response = await getClient().delete(path);
  return response.data;
};

const healthCheck = async () => {
  try {
    const response = await getClient().get("/api/method/ping");
    return { ok: true, status: response.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

module.exports = {
  getClient,
  get,
  post,
  put,
  del,
  healthCheck,
};