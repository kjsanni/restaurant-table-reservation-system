const response = require("../utils/response");

const db = require("../../db/models");
const { _queues } = require("../../queues/queue");

const getTenantDebugInfoHandler = async (req, res) => {
  const tenantId = req.params.tenantId;
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const recentAppointments = await db.sequelize.models.appointment.findAll({
    where: { tenantId },
    limit: 5,
    order: [["createdAt", "DESC"]],
  });

  const recentReservations = await db.sequelize.models.reservation.findAll({
    where: { tenantId },
    limit: 5,
    order: [["createdAt", "DESC"]],
  });

  const userCount = await db.user.count({ where: { tenantId } });
  const customerCount = await db.customer.count({ where: { tenantId } });

  res.status(200).json({
    success: true,
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status, businessVertical: tenant.businessVertical },
    counts: { users: userCount, customers: customerCount },
    recentAppointments,
    recentReservations,
  });
};

const getPlatformDebugInfoHandler = async (req, res) => {
  const checks = { database: "unknown", redis: "unknown", bullmq: "unknown", memory: "unknown" };

  try {
    await db.sequelize.authenticate();
    checks.database = "healthy";
  } catch (e) {
    checks.database = "unhealthy";
  }

  try {
    if (process.env.REDIS_HOST) {
      const { client: redisClient } = require("../../utils/cache");
      const pong = await redisClient.ping();
      checks.redis = pong === "PONG" ? "healthy" : "degraded";
      checks.bullmq = "healthy";
    } else {
      checks.redis = "unavailable";
      checks.bullmq = "unavailable";
    }
  } catch (e) {
    checks.redis = "unhealthy";
    checks.bullmq = "unhealthy";
  }

  const mem = process.memoryUsage();
  const memPercent = (mem.heapUsed / mem.heapTotal) * 100;
  checks.memory = memPercent > 90 ? "degraded" : "healthy";

  const tenantCount = await db.tenant.count();
  const userCount = await db.user.count();
  const reservationCount = await db.sequelize.models.reservation.count();

  res.status(200).json({
    success: true,
    checks,
    counts: { tenants: tenantCount, users: userCount, reservations: reservationCount },
    nodeEnv: process.env.NODE_ENV,
    redis: process.env.REDIS_HOST ? "configured" : "not configured",
  });
};

module.exports = {
  getTenantDebugInfoHandler,
  getPlatformDebugInfoHandler,
};
