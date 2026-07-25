const logEmailService = require("../services/logEmail.service");
const { isRedisAvailable } = require("../queues/queue");

const emailLogsHandler = async (req, res) => {
  await logEmailService.sendLogsEmail();

  return res.status(200).json({
    success: true,
    message: "Logs sent successfully!",
  });
};

const healthCheckHandler = async (req, res) => {
  const checks = {
    database: "unknown",
    redis: "unknown",
    bullmq: "unknown",
    memory: "unknown",
  };

  try {
    const db = require("../db/models");
    await db.sequelize.authenticate();
    checks.database = "healthy";
  } catch (err) {
    checks.database = "unhealthy";
  }

  try {
    const redisOk = await isRedisAvailable();
    checks.redis = redisOk ? "healthy" : "unavailable";
    checks.bullmq = redisOk ? "healthy" : "unavailable";
  } catch {
    checks.redis = "unavailable";
    checks.bullmq = "unavailable";
  }

  const mem = process.memoryUsage();
  const memUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  checks.memory = memUsedMB < 512 ? "healthy" : "warning";

  const overall = Object.values(checks).every((v) => v === "healthy" || v === "unavailable")
    ? "healthy"
    : "degraded";

  res.status(200).json({
    success: true,
    status: overall,
    checks,
    memory: {
      heapUsedMB: memUsedMB,
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  emailLogsHandler,
  healthCheckHandler,
};
