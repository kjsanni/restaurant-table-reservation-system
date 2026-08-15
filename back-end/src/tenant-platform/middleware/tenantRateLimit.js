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

module.exports = {
  tenantLimiter,
  tenantWriteLimiter,
};
