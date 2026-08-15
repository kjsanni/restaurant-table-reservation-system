"use strict";

const axios = require("axios");
const { cache } = require("../../utils/cache");
const authDAO = require("../../DAOs/auth.dao");

const ERPNEXT_TIMEOUT_DEFAULT = 30000;
const CACHE_TTL_DEFAULT = 300;

let clientInstance = null;
let clientConfig = null;

const getConfig = async () => {
  if (clientConfig) return clientConfig;

  const [baseUrlSetting, apiKeySetting, apiSecretSetting, timeoutSetting, cacheTtlSetting] =
    await Promise.all([
      authDAO.getPlatformSettingByKey("erpnext_base_url").catch(() => null),
      authDAO.getPlatformSettingByKey("erpnext_api_key").catch(() => null),
      authDAO.getPlatformSettingByKey("erpnext_api_secret").catch(() => null),
      authDAO.getPlatformSettingByKey("erpnext_timeout_ms").catch(() => null),
      authDAO.getPlatformSettingByKey("erpnext_cache_ttl").catch(() => null),
    ]);

  clientConfig = {
    baseUrl: (baseUrlSetting?.value && baseUrlSetting.value !== "[REDACTED]" ? baseUrlSetting.value : null) ||
             process.env.ERPNEXT_BASE_URL || "",
    apiKey: (apiKeySetting?.value && apiKeySetting.value !== "[REDACTED]" ? apiKeySetting.value : null) ||
            process.env.ERPNEXT_API_KEY || "",
    apiSecret: (apiSecretSetting?.value && apiSecretSetting.value !== "[REDACTED]" ? apiSecretSetting.value : null) ||
               process.env.ERPNEXT_API_SECRET || "",
    timeout: parseInt(
      (timeoutSetting?.value != null ? timeoutSetting.value : process.env.ERPNEXT_TIMEOUT_MS) ||
        ERPNEXT_TIMEOUT_DEFAULT,
      10
    ),
    cacheTtl: parseInt(
      (cacheTtlSetting?.value != null ? cacheTtlSetting.value : process.env.ERPNEXT_CACHE_TTL) ||
        CACHE_TTL_DEFAULT,
      10
    ),
  };

  return clientConfig;
};

const getClient = async () => {
  if (clientInstance) return clientInstance;

  const config = await getConfig();

  clientInstance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
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

const getCacheTtl = async () => {
  const config = await getConfig();
  return config.cacheTtl;
};

const get = async (path, params = {}, tenantId = null) => {
  const cacheKey = tenantId ? `erpnext:${tenantId}:${path}:${JSON.stringify(params)}` : null;
  if (cacheKey) {
    const cached = await cache.get(cacheKey);
    if (cached !== null) return cached;
  }

  const client = await getClient();
  const response = await client.get(path, { params });
  const data = response.data;
  const ttl = await getCacheTtl();

  if (cacheKey && data) {
    await cache.set(cacheKey, data, ttl);
  }

  return data;
};

const post = async (path, body = {}, _tenantId = null) => {
  const client = await getClient();
  const response = await client.post(path, body);
  return response.data;
};

const put = async (path, body = {}, _tenantId = null) => {
  const client = await getClient();
  const response = await client.put(path, body);
  return response.data;
};

const del = async (path, _tenantId = null) => {
  const client = await getClient();
  const response = await client.delete(path);
  return response.data;
};

const healthCheck = async () => {
  try {
    const client = await getClient();
    const response = await client.get("/api/method/ping");
    return { ok: true, status: response.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

const resetClient = () => {
  clientInstance = null;
  clientConfig = null;
};

module.exports = {
  getClient,
  getConfig,
  get,
  post,
  put,
  del,
  healthCheck,
  resetClient,
};
