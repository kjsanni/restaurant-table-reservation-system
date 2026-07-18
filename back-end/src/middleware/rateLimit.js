const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const { client } = require("../utils/cache");

const createRedisStore = () => {
  if (!client) return undefined;
  return new RedisStore({
    client,
    prefix: "rl:",
  });
};

const redisStore = createRedisStore();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many bulk operations. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

const adminActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many admin actions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
});

module.exports = {
  authLimiter,
  generalLimiter,
  bulkOperationLimiter,
  adminActionLimiter,
};
