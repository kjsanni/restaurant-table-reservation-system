"use strict";

const { client, getConnectionStatus } = require("../../utils/cache");

const BURST_PREFIX = "rl:burst:";
const CIRCUIT_PREFIX = "circuit:";
const BURST_WINDOW_MS = 60 * 1000;
const BURST_LIMIT = 10;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RECOVERY_TIME_MS = 30 * 1000;

const getBurstKey = (tenantId) => `${BURST_PREFIX}${tenantId}`;
const getCircuitKey = (tenantId) => `${CIRCUIT_PREFIX}${tenantId}`;

const checkBurstQuota = async (tenantId) => {
  if (!tenantId) return { allowed: true };
  const key = getBurstKey(tenantId);
  try {
    if (client && getConnectionStatus()) {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, Math.ceil(BURST_WINDOW_MS / 1000));
      }
      return { allowed: count <= BURST_LIMIT, remaining: Math.max(0, BURST_LIMIT - count) };
    }
  } catch {
    console.warn("[tenantResilience] Redis unavailable for burst quota; allowing request");
  }
  return { allowed: true };
};

const recordTenantFailure = async (tenantId) => {
  if (!tenantId) return;
  const key = getCircuitKey(tenantId);
  try {
    if (client && getConnectionStatus()) {
      const failures = await client.incr(key);
      if (failures === 1) {
        await client.expire(key, Math.ceil(CIRCUIT_RECOVERY_TIME_MS / 1000));
      }
    }
  } catch {
    console.warn("[tenantResilience] Redis unavailable for circuit breaker");
  }
};

const isCircuitOpen = async (tenantId) => {
  if (!tenantId) return false;
  const key = getCircuitKey(tenantId);
  try {
    if (client && getConnectionStatus()) {
      const failures = await client.get(key);
      return failures && parseInt(failures, 10) >= CIRCUIT_FAILURE_THRESHOLD;
    }
  } catch {
    console.warn("[tenantResilience] Redis unavailable for circuit check");
  }
  return false;
};

const tenantBurstQuota = async (req, res, next) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) return next();
  const { allowed, remaining } = await checkBurstQuota(tenantId);
  if (!allowed) {
    return res.status(429).json({
      success: false,
      message: "Burst quota exceeded. Please slow down.",
      retryAfter: 60,
    });
  }
  if (remaining !== undefined) {
    res.setHeader("X-RateLimit-Remaining", remaining);
  }
  next();
};

const tenantCircuitBreaker = async (req, res, next) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) return next();
  const open = await isCircuitOpen(tenantId);
  if (open) {
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable for this tenant. Please try again later.",
    });
  }
  next();
};

const tenantErrorRecorder = async (err, req, res, next) => {
  if (err && req.tenant?.id) {
    await recordTenantFailure(req.tenant.id);
  }
  next(err);
};

module.exports = {
  tenantBurstQuota,
  tenantCircuitBreaker,
  tenantErrorRecorder,
  checkBurstQuota,
  recordTenantFailure,
  isCircuitOpen,
};
