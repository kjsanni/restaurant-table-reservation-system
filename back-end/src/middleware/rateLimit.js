const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { client } = require("../utils/cache");

const createRedisStore = (prefix) => {
  if (!client) return undefined;
  return new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
    prefix,
  });
};

// Rate-limit maxima are overridable via environment variables so that dedicated
// load-testing instances can raise (or effectively disable) throttling without
// affecting production defaults. When unset, the original production values are
// used. Set RATE_LIMIT_DISABLED=true to bypass all limiters (LOAD TESTING ONLY).
const numEnv = (name, fallback) => {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === "true";

const makeLimiter = (prefix, opts) => {
  if (RATE_LIMIT_DISABLED) {
    return (req, res, next) => next();
  }
  return rateLimit({ ...opts, store: createRedisStore(prefix) });
};

const authLimiter = makeLimiter("rl:auth:", {
  windowMs: 15 * 60 * 1000,
  max: numEnv("RATE_LIMIT_AUTH_MAX", 10),
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = makeLimiter("rl:general:", {
  windowMs: 15 * 60 * 1000,
  max: numEnv("RATE_LIMIT_GENERAL_MAX", 100),
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const bulkOperationLimiter = makeLimiter("rl:bulk:", {
  windowMs: 60 * 60 * 1000,
  max: numEnv("RATE_LIMIT_BULK_MAX", 5),
  message: {
    success: false,
    message: "Too many bulk operations. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminActionLimiter = makeLimiter("rl:admin:", {
  windowMs: 60 * 60 * 1000,
  max: numEnv("RATE_LIMIT_ADMIN_MAX", 3),
  message: {
    success: false,
    message: "Too many admin actions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  generalLimiter,
  bulkOperationLimiter,
  adminActionLimiter,
};
