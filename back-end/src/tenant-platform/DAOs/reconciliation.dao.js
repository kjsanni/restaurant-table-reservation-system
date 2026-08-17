const db = require("../../db/models");

const reconciliationDAO = {};

const toValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

reconciliationDAO.getMultiCurrencyTotals = async (filters = {}) => {
  const where = {};
  const fromDate = toValidDate(filters.from);
  const toDate = toValidDate(filters.to);
  if (fromDate) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: fromDate };
  if (toDate) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: toDate };
  if (filters.tenantId) where.tenantId = filters.tenantId;

  const rows = await db.payment.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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

  const tenants = await db.tenant.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: tenantWhere,
    attributes: ["id", "name", "slug", "currency", "plan", "status"],
  });

  const tenantIds = tenants.map((t) => t.id);

  let paymentWhere = {};
  if (tenantIds.length > 0) {
    paymentWhere.tenantId = { [db.Sequelize.Op.in]: tenantIds };
  }
  const fromDate = toValidDate(filters.from);
  const toDate = toValidDate(filters.to);
  if (fromDate) paymentWhere.createdAt = { ...paymentWhere.createdAt, [db.Sequelize.Op.gte]: fromDate };
  if (toDate) paymentWhere.createdAt = { ...paymentWhere.createdAt, [db.Sequelize.Op.lte]: toDate };

  const paymentStats = await db.payment.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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
