const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "proxy-authorization",
]);

const SENSITIVE_PATH_PREFIXES = [
  "/api/v1/admin/tenants/=/i/",
];

const sanitizePath = (path) => {
  if (SENSITIVE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return `${prefix}:id`;
  }
  return path;
};

const sanitizeHeaders = (headers) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const requestTiming = (req, res, next) => {
  const label = `${req.method} ${sanitizePath(req.path)}`;
  console.time(label);
  res.on("finish", () => {
    console.timeEnd(label);
    console.log(JSON.stringify({
      method: req.method,
      path: sanitizePath(req.path),
      tenantId: req.tenant?.id || null,
      statusCode: res.statusCode,
      durationMs: Date.now() - req._timingStart,
    }));
  });
  req._timingStart = Date.now();
  next();
};

const Sentry = require("@sentry/node");
const { getCacheStats } = require("../utils/cache");

// Initialize Sentry only if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

// Request metrics middleware
const metrics = {
  requests: 0,
  errors: 0,
  totalDuration: 0,
};

const requestMetrics = (req, res, next) => {
  const start = Date.now();
  metrics.requests++;

  res.on("finish", () => {
    const duration = Date.now() - start;
    metrics.totalDuration += duration;
  });

  next();
};

const errorHandler = (err, req, res, next) => {
  metrics.errors++;

  if (process.env.NODE_ENV === "production") {
    console.error(err.message || "Internal server error");
  } else {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

const getStats = () => {
  const cacheStats = getCacheStats();
  const cacheHitRate = cacheStats.gets ? cacheStats.hits / cacheStats.gets : 0;

  return {
    ...metrics,
    avgResponseTime: metrics.requests ? Math.round(metrics.totalDuration / metrics.requests) : 0,
    uptime: process.uptime(),
    cache: {
      ...cacheStats,
      hitRate: cacheHitRate,
    },
  };
};

module.exports = { Sentry, requestMetrics, requestTiming, errorHandler, getStats };