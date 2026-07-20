const db = require("../../db/models");

const usageDAO = {};

usageDAO.getTenantUsage = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) return null;

  const plan = await db.subscriptionPlan.findOne({ where: { slug: tenant.plan, isActive: true } });
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

  return {
    tenantId,
    tenantName: tenant.name,
    plan: tenant.plan,
    limits,
    usage: {
      tables: tablesCount,
      reservationsThisMonth: reservationsCount,
    },
    percentages: {
      tables: tablesPercent,
      reservations: reservationsPercent,
    },
    warnings: {
      tables: tablesPercent >= 80,
      reservations: reservationsPercent >= 80,
    },
  };
};

usageDAO.getAllTenantsUsage = async (filters = {}) => {
  const tenantWhere = {};
  if (filters.plan) tenantWhere.plan = filters.plan;
  if (filters.status) tenantWhere.status = filters.status;

  const tenants = await db.tenant.findAll({ where: tenantWhere });
  const results = [];
  for (const t of tenants) {
    const usage = await usageDAO.getTenantUsage(t.id);
    if (usage) results.push(usage);
  }
  return results;
};

module.exports = usageDAO;
