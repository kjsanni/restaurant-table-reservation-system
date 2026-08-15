const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { client, getConnectionStatus } = require("../../utils/cache");
const { makeLimiter } = require("../../middleware/rateLimit");

const tenantLimiter = makeLimiter("rl:tenant:", {
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const tenantWriteLimiter = makeLimiter("rl:tenant-write:", {
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many write requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const makeTenantLimiter = (opts = {}) => {
  const { redisPrefix = "rl:tenant:", ...rateOpts } = opts;
  let store;

  if (client && getConnectionStatus()) {
    store = new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
      prefix: redisPrefix,
    });
  } else {
    console.warn(`[rateLimit] Redis unavailable for ${redisPrefix}; using in-memory store.`);
  }

  return rateLimit({
    ...rateOpts,
    ...(store ? { store } : {}),
    keyGenerator: (req) => `${req.tenant?.id || "anon"}:${req.ip || ""}`,
  });
};

module.exports = {
  tenantLimiter,
  tenantWriteLimiter,
  makeTenantLimiter,
};
