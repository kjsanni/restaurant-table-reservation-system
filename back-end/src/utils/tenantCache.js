const { cache, getCacheStats, resetCacheStats } = require("./cache");

const TENANT_PREFIX = (tenantId) => `tenant:${tenantId}:`;

const tenantCache = {
  get: async (tenantId, key) => {
    const prefixedKey = `${TENANT_PREFIX(tenantId)}${key}`;
    return cache.get(prefixedKey);
  },

  set: async (tenantId, key, data, ttl = 300) => {
    const prefixedKey = `${TENANT_PREFIX(tenantId)}${key}`;
    return cache.set(prefixedKey, data, ttl);
  },

  del: async (tenantId, key) => {
    const prefixedKey = `${TENANT_PREFIX(tenantId)}${key}`;
    return cache.del(prefixedKey);
  },

  invalidatePattern: async (tenantId, pattern) => {
    if (!tenantId) return;
    const prefix = `${TENANT_PREFIX(tenantId)}${pattern}`;
    return cache.del(prefix);
  },

  getStats: () => getCacheStats(),

  resetStats: () => resetCacheStats(),
};

module.exports = { tenantCache };
