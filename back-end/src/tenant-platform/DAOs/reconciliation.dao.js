const db = require("../../db/models");

const reconciliationDAO = {};

reconciliationDAO.getMultiCurrencyTotals = async (filters = {}) => {
  const where = {};
  if (filters.from) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(filters.from) };
  if (filters.to) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(filters.to) };
  if (filters.tenantId) where.tenantId = filters.tenantId;

  const rows = await db.payment.findAll({
    where,
    attributes: [
      "currency",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"],
      [db.sequelize.fn("SUM", db.sequelize.col("baseAmount")), "totalBaseAmount"],
    ],
    group: ["currency"],
    raw: false,
  });

  return rows.map((row) => ({
    currency: row.currency,
    count: parseInt(row.get("count"), 10),
    totalAmount: parseFloat(row.get("totalAmount") || 0),
    totalBaseAmount: parseFloat(row.get("totalBaseAmount") || 0),
  }));
};

reconciliationDAO.getTenantCurrencyBreakdown = async (filters = {}) => {
  const tenantWhere = {};
  if (filters.plan) tenantWhere.plan = filters.plan;
  if (filters.status) tenantWhere.status = filters.status;

  const tenants = await db.tenant.findAll({
    where: tenantWhere,
    attributes: ["id", "name", "slug", "currency", "plan", "status"],
  });

  const tenantIds = tenants.map((t) => t.id);

  let paymentWhere = {};
  if (tenantIds.length > 0) {
    paymentWhere.tenantId = { [db.Sequelize.Op.in]: tenantIds };
  }
  if (filters.from) paymentWhere.createdAt = { ...paymentWhere.createdAt, [db.Sequelize.Op.gte]: new Date(filters.from) };
  if (filters.to) paymentWhere.createdAt = { ...paymentWhere.createdAt, [db.Sequelize.Op.lte]: new Date(filters.to) };

  const paymentStats = await db.payment.findAll({
    where: paymentWhere,
    attributes: [
      "tenantId",
      "currency",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"],
      [db.sequelize.fn("SUM", db.sequelize.col("baseAmount")), "totalBaseAmount"],
    ],
    group: ["tenantId", "currency"],
    raw: false,
  });

  const statsMap = {};
  for (const row of paymentStats) {
    const key = `${row.tenantId}::${row.currency}`;
    statsMap[key] = {
      currency: row.currency,
      count: parseInt(row.get("count"), 10),
      totalAmount: parseFloat(row.get("totalAmount") || 0),
      totalBaseAmount: parseFloat(row.get("totalBaseAmount") || 0),
    };
  }

  return tenants.map((t) => {
    const tenantStats = Object.entries(statsMap)
      .filter(([key]) => key.startsWith(`${t.id}::`))
      .map(([, value]) => value);

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      currency: t.currency,
      plan: t.plan,
      status: t.status,
      payments: tenantStats,
    };
  });
};

module.exports = reconciliationDAO;
