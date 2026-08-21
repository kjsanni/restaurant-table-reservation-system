const db = require("../../db/models");

const usageDAO = {};

usageDAO.getTenantUsage = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId); // codacy-suppress nosql-injection - parameterized ORM call
  if (!tenant) return null;

// codacy-suppress NoSqlInjection
  const plan = await db.subscriptionPlan.findOne({ where: { slug: tenant.plan, isActive: true } }); // codacy-suppress nosql-injection - parameterized ORM call
  const defaultPlan = {
    starter: { maxTables: 10, maxReservationsPerMonth: 500 },
    growth: { maxTables: 30, maxReservationsPerMonth: 2000 },
    enterprise: { maxTables: Infinity, maxReservationsPerMonth: Infinity },
  };
  const limits = plan || defaultPlan[tenant.plan] || defaultPlan.starter;

  const tablesCount = await db.table.count({ where: { tenantId } });
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const reservationsCount = await db.reservation.count({
    where: {
      tenantId,
      createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
    },
  });

  const tablesPercent = limits.maxTables === Infinity ? 0 : Math.round((tablesCount / limits.maxTables) * 100);
  const reservationsPercent = limits.maxReservationsPerMonth === Infinity ? 0 : Math.round((reservationsCount / limits.maxReservationsPerMonth) * 100);

  const eventsCount = await db.event.count({ where: { tenantId } });
  const bookingsCount = await db.eventBooking.count({
    where: {
      tenantId,
      createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
    },
  });

  const { getEventLimits } = require("../services/planLimits.service");
  const eventLimits = getEventLimits(plan);
  const eventsPercent = eventLimits.maxEvents === Infinity ? 0 : Math.round((eventsCount / eventLimits.maxEvents) * 100);
  const bookingsPercent = eventLimits.maxBookingsPerMonth === Infinity ? 0 : Math.round((bookingsCount / eventLimits.maxBookingsPerMonth) * 100);

  return {
    tenantId,
    tenantName: tenant.name,
    plan: tenant.plan,
    limits,
    eventLimits,
    usage: {
      tables: tablesCount,
      reservationsThisMonth: reservationsCount,
      events: eventsCount,
      bookingsThisMonth: bookingsCount,
    },
    tablesUsed: tablesCount,
    tablesLimit: limits.maxTables,
    reservationsUsed: reservationsCount,
    reservationsLimit: limits.maxReservationsPerMonth,
    eventsUsed: eventsCount,
    eventsLimit: eventLimits.maxEvents,
    bookingsUsed: bookingsCount,
    bookingsLimit: eventLimits.maxBookingsPerMonth,
    percentages: {
      tables: tablesPercent,
      reservations: reservationsPercent,
      events: eventsPercent,
      bookingsThisMonth: bookingsPercent,
    },
    warnings: {
      tables: tablesPercent >= 80,
      reservations: reservationsPercent >= 80,
      events: eventsPercent >= 80,
      bookingsThisMonth: bookingsPercent >= 80,
    },
  };
};

usageDAO.getAllTenantsUsage = async (filters = {}) => {
  const tenantWhere = {};
  if (filters.plan) tenantWhere.plan = filters.plan;
  if (filters.status) tenantWhere.status = filters.status;

  const tenants = await db.tenant.findAll({ where: tenantWhere }); // codacy-suppress nosql-injection - parameterized ORM call
  const results = [];
  for (const t of tenants) {
    const usage = await usageDAO.getTenantUsage(t.id);
    if (usage) results.push(usage);
  }
  return results;
};

module.exports = usageDAO;
