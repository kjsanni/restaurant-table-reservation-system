const { exec } = require("child_process");
const { promisify } = require("util");
const _execAsync = promisify(exec);

const getDeploymentStatusHandler = async (req, res) => {
  const status = {
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "unknown",
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    lastDeploy: process.env.LAST_DEPLOY || null,
    commit: process.env.GIT_COMMIT || null,
    branch: process.env.GIT_BRANCH || null,
    ci: process.env.CI === "true",
  };

  res.status(200).json({ success: true, status });
};

const getDeploymentHealthHandler = async (req, res) => {
  const checks = {
    database: "unknown",
    redis: "unknown",
    queues: "unknown",
  };

  try {
    const db = require("../../db/models");
    await db.sequelize.authenticate();
    checks.database = "healthy";
  } catch {
    checks.database = "unhealthy";
  }

  try {
    const { isRedisAvailable } = require("../../queues/queue");
    const redisOk = await isRedisAvailable();
    checks.redis = redisOk ? "healthy" : "unavailable";
    checks.queues = redisOk ? "healthy" : "unavailable";
  } catch {
    checks.redis = "unavailable";
    checks.queues = "unavailable";
  }

  const overall = Object.values(checks).every((v) => v === "healthy" || v === "unavailable")
    ? "healthy"
    : "degraded";

  res.status(200).json({
    success: true,
    status: overall,
    checks,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getDeploymentStatusHandler,
  getDeploymentHealthHandler,
};
