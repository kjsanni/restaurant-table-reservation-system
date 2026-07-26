const db = require("../../db/models");
const { queues } = require("../../queues/queue");

const getTenantDebugInfoHandler = async (req, res) => {
  const tenantId = req.params.tenantId;
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
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
  const tenantCount = await db.tenant.count();
  const userCount = await db.user.count();
  const reservationCount = await db.sequelize.models.reservation.count();

  res.status(200).json({
    success: true,
    counts: { tenants: tenantCount, users: userCount, reservations: reservationCount },
    nodeEnv: process.env.NODE_ENV,
    redis: process.env.REDIS_HOST ? "configured" : "not configured",
  });
};

module.exports = {
  getTenantDebugInfoHandler,
  getPlatformDebugInfoHandler,
};
