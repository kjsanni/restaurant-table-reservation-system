"use strict";

const rateLimit = require("express-rate-limit");
const { client, getConnectionStatus } = require("../../utils/cache");
const { logAction, validateCsrfToken } = require("../../middleware");

const memoryStore = new Map();

class TenantStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.memoryStore = memoryStore;
    this.redisClient = client;
    this.redisAvailable = client && getConnectionStatus();
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    if (this.redisAvailable) {
      const count = await this.redisClient.incr(fullKey);
      if (count === 1) {
        await this.redisClient.expire(fullKey, 60);
      }
      return { totalHits: count };
    }
    const now = Date.now();
    const windowMs = 60 * 1000;
    const entry = this.memoryStore.get(fullKey);
    if (!entry || now - entry.windowStart > windowMs) {
      this.memoryStore.set(fullKey, { count: 1, windowStart: now });
      return { totalHits: 1 };
    }
    entry.count += 1;
    this.memoryStore.set(fullKey, entry);
    return { totalHits: entry.count };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (this.redisAvailable) {
      await this.redisClient.decr(fullKey);
      return;
    }
    const entry = this.memoryStore.get(fullKey);
    if (entry && entry.count > 0) {
      entry.count -= 1;
      this.memoryStore.set(fullKey, entry);
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    if (this.redisAvailable) {
      await this.redisClient.del(fullKey);
      return;
    }
    this.memoryStore.delete(fullKey);
  }
}

const numEnv = (name, fallback) => {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const makeTenantLimiter = (opts) => {
  const store = new TenantStore(opts.redisPrefix || "rl:tenant:");

  return rateLimit({
    store,
    keyGenerator: (req) => `tenant:${req.tenant?.id || "anonymous"}`,
    windowMs: opts.windowMs || 60 * 1000,
    max: opts.max || numEnv("RATE_LIMIT_TENANT_MAX", 120),
    message: {
      success: false,
      message: opts.message || "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.tenant,
  });
};

const withTenantRateLimit = (routeMiddleware = [], limiter = tenantLimiter) => {
  return [logAction, validateCsrfToken, limiter, ...routeMiddleware];
};

const tenantLimiter = makeTenantLimiter({
  windowMs: 60 * 1000,
  max: numEnv("RATE_LIMIT_TENANT_MAX", 120),
  message: "Too many requests for this tenant. Please try again later.",
  redisPrefix: "rl:tenant:",
});

const tenantWriteLimiter = makeTenantLimiter({
  windowMs: 60 * 1000,
  max: numEnv("RATE_LIMIT_TENANT_WRITE_MAX", 60),
  message: "Too many write requests. Please try again later.",
  redisPrefix: "rl:tenant-write:",
});

module.exports = {
  tenantLimiter,
  tenantWriteLimiter,
  makeTenantLimiter,
  withTenantRateLimit,
};
