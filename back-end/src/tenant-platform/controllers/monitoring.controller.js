const db = require("../../db/models");
const { queues, isRedisAvailable } = require("../../utils/cache");

const getQueueStatsHandler = async (req, res) => {
  const queueNames = ["notifications", "reports"];
  const stats = [];

  for (const name of queueNames) {
    try {
      const queue = queues.find((q) => q.name === name);
      if (!queue) {
        stats.push({ name, waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0 });
        continue;
      }
      const counts = await queue.getJobCounts();
      const failed = await queue.getFailedJobs(0, 10);
      stats.push({
        name,
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        failed: counts.failed || 0,
        completed: counts.completed || 0,
        delayed: counts.delayed || 0,
        recentFailed: failed.slice(0, 5).map((job) => ({
          id: job.id,
          name: job.name,
          failedReason: job.failedReason,
          timestamp: job.timestamp,
        })),
      });
    } catch {
      stats.push({ name, waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0, error: "unavailable" });
    }
  }

  const redisAvailable = await isRedisAvailable();
  res.status(200).json({
    success: true,
    redisAvailable,
    queues: stats,
  });
};

const getDatabaseStatsHandler = async (req, res) => {
  try {
    const connection = db.sequelize.connectionManager?.pool?.size || 0;
    const available = db.sequelize.connectionManager?.pool?.available || 0;
    const waiting = db.sequelize.connectionManager?.pool?.waiting || 0;

    const slowQueries = [];
    try {
      const [rows] = await db.sequelize.query("SHOW STATUS WHERE Variable_name = 'Slow_queries'");
      if (rows && rows.length > 0) {
        slowQueries.push({ metric: "Slow_queries", value: rows[0].Value });
      }
    } catch {
      // MySQL user may not have PROCESS privilege
    }

    res.status(200).json({
      success: true,
      connection: {
        total: connection,
        available,
        waiting,
      },
      slowQueries,
      status: "healthy",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch database stats", error: err.message });
  }
};

const getErrorRateHandler = async (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const logPath = path.join(process.cwd(), "logs", "requests.log");

  let errorStats = {
    total: 0,
    errors4xx: 0,
    errors5xx: 0,
    byTenant: {},
  };

  if (!fs.existsSync(logPath)) {
    return res.status(200).json({ success: true, ...errorStats, note: "No request log file found" });
  }

  try {
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.timestamp && new Date(entry.timestamp).getTime() < oneDayAgo) continue;
        errorStats.total++;
        if (entry.status >= 400 && entry.status < 500) {
          errorStats.errors4xx++;
        } else if (entry.status >= 500) {
          errorStats.errors5xx++;
        }
        const tenantId = entry.tenantId || "unknown";
        if (!errorStats.byTenant[tenantId]) {
          errorStats.byTenant[tenantId] = { total: 0, errors4xx: 0, errors5xx: 0 };
        }
        errorStats.byTenant[tenantId].total++;
        if (entry.status >= 400 && entry.status < 500) errorStats.byTenant[tenantId].errors4xx++;
        if (entry.status >= 500) errorStats.byTenant[tenantId].errors5xx++;
      } catch {
        // skip unparseable lines
      }
    }
  } catch {
    // skip read errors
  }

  res.status(200).json({ success: true, ...errorStats });
};

const getIntegrationLatencyHandler = async (req, res) => {
  const integrations = {
    paystack: { name: "Paystack", latencyMs: null, status: "unknown", lastCheck: null },
    whatsapp: { name: "WhatsApp", latencyMs: null, status: "unknown", lastCheck: null },
    shaqexpress: { name: "Shaq Express", latencyMs: null, status: "unknown", lastCheck: null },
    email: { name: "Email", latencyMs: null, status: "unknown", lastCheck: null },
  };

  const checkLatency = async (name, url) => {
    const start = Date.now();
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      const latency = Date.now() - start;
      return { name, latencyMs: latency, status: response.ok ? "healthy" : "degraded", lastCheck: new Date().toISOString() };
    } catch {
      return { name, latencyMs: null, status: "unhealthy", lastCheck: new Date().toISOString() };
    }
  };

  const paystackUrl = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";
  const checks = [
    checkLatency("paystack", `${paystackUrl}/transaction`),
    checkLatency("whatsapp", "https://graph.facebook.com"),
    checkLatency("shaqexpress", "https://api.shaqexpress.com"),
    checkLatency("email", process.env.EMAIL_SMTP_HOST || "smtp.gmail.com"),
  ];

  const results = await Promise.all(checks);
  for (const result of results) {
    if (result && integrations[result.name]) {
      integrations[result.name] = result;
    }
  }

  res.status(200).json({ success: true, integrations });
};

module.exports = {
  getQueueStatsHandler,
  getDatabaseStatsHandler,
  getErrorRateHandler,
  getIntegrationLatencyHandler,
};
