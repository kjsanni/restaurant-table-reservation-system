const db = require("../../db/models");

const getTenantGrowthMetricsHandler = async (req, res) => {
  const total = await db.tenant.count();
  const newTenants = await db.tenant.findAll({
    where: {
      createdAt: {
        [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    attributes: ["id", "name", "status", "plan", "createdAt"],
  });

  const churned = await db.tenant.findAll({
    where: {
      status: "cancelled",
      updatedAt: {
        [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    attributes: ["id", "name", "status", "plan", "updatedAt"],
  });

  const reactivated = await db.tenant.findAll({
    where: {
      status: "active",
      updatedAt: {
        [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    attributes: ["id", "name", "status", "plan", "updatedAt"],
  });

  res.status(200).json({
    success: true,
    summary: {
      total,
      newTenants: newTenants.length,
      churned: churned.length,
      reactivated: reactivated.length,
    },
    newTenants,
    churned,
    reactivated,
  });
};

const getChurnAnalysisHandler = async (req, res) => {
  const { plan, from, to } = req.query;
  const where = { status: "cancelled" };
  if (plan) where.plan = plan;
  if (from || to) {
    where.updatedAt = {};
    if (from) where.updatedAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.updatedAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const churned = await db.tenant.findAll({
    where,
    attributes: ["id", "name", "plan", "status", "updatedAt", "cancelAtPeriodEnd"],
  });

  const byPlan = {};
  for (const tenant of churned) {
    const key = tenant.plan || "unknown";
    byPlan[key] = (byPlan[key] || 0) + 1;
  }

  res.status(200).json({
    success: true,
    totalChurned: churned.length,
    byPlan,
    collection: churned,
  });
};

const getLtvCacHandler = async (req, res) => {
  const tenants = await db.tenant.findAll({
    where: { status: "active" },
    attributes: ["id", "name", "plan", "monthlyRevenue", "createdAt"],
  });

  const ltvData = tenants.map((t) => {
    const monthsActive = Math.max(
      1,
      Math.ceil((Date.now() - new Date(t.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
    );
    const mrr = parseFloat(t.monthlyRevenue || 0);
    const ltv = mrr * monthsActive;
    return {
      id: t.id,
      name: t.name,
      plan: t.plan,
      mrr,
      monthsActive,
      ltv,
    };
  });

  const avgLtv = ltvData.length > 0
    ? ltvData.reduce((sum, item) => sum + item.ltv, 0) / ltvData.length
    : 0;

  res.status(200).json({
    success: true,
    summary: {
      totalActive: tenants.length,
      avgLtv,
      totalLtv: ltvData.reduce((sum, item) => sum + item.ltv, 0),
    },
    collection: ltvData,
  });
};

const getRevenueAnalyticsHandler = async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const transactions = await db.payment.findAll({
    where,
    attributes: [
      "id",
      "tenantId",
      "amount",
      "currency",
      "method",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const byTenant = {};
  for (const tx of transactions) {
    const key = tx.tenantId || "unknown";
    if (!byTenant[key]) {
      byTenant[key] = { total: 0, count: 0, completed: 0 };
    }
    byTenant[key].count += 1;
    byTenant[key].total += parseFloat(tx.amount || 0);
    if (tx.status === "completed") byTenant[key].completed += 1;
  }

  res.status(200).json({
    success: true,
    summary: { totalRevenue, totalTransactions: transactions.length, byTenant },
    collection: transactions,
  });
};

const getBookingAnalyticsHandler = async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const reservations = await db.reservation.findAll({
    where,
    attributes: [
      "id",
      "tenantId",
      "partySize",
      "status",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  const totalBookings = reservations.length;
  const confirmed = reservations.filter((r) => r.status === "confirmed").length;
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;
  const noShows = reservations.filter((r) => r.status === "no_show").length;

  const byTenant = {};
  for (const r of reservations) {
    const key = r.tenantId || "unknown";
    if (!byTenant[key]) byTenant[key] = { total: 0, confirmed: 0, cancelled: 0, noShows: 0 };
    byTenant[key].total += 1;
    if (r.status === "confirmed") byTenant[key].confirmed += 1;
    if (r.status === "cancelled") byTenant[key].cancelled += 1;
    if (r.status === "no_show") byTenant[key].noShows += 1;
  }

  res.status(200).json({
    success: true,
    summary: { totalBookings, confirmed, cancelled, noShows, byTenant },
    collection: reservations,
  });
};

const getPaymentAnalyticsHandler = async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const payments = await db.payment.findAll({
    where,
    attributes: [
      "id",
      "tenantId",
      "amount",
      "currency",
      "method",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  const byMethod = {};
  for (const p of payments) {
    const method = p.method || "unknown";
    if (!byMethod[method]) byMethod[method] = { total: 0, count: 0 };
    byMethod[method].count += 1;
    byMethod[method].total += parseFloat(p.amount || 0);
  }

  const totalCompleted = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const failedPayments = payments.filter((p) => p.status === "failed").length;

  res.status(200).json({
    success: true,
    summary: {
      totalPayments: payments.length,
      totalCompleted,
      failedPayments,
      byPaymentMethod: byMethod,
    },
    collection: payments,
  });
};

const getUsageAnalyticsHandler = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const dailyActiveTenants = await db.tenant.count({
    where: {
      updatedAt: { [db.Sequelize.Op.gte]: thirtyDaysAgo },
      status: "active",
    },
  });

  const totalReservations = await db.reservation.count({
    where: { createdAt: { [db.Sequelize.Op.gte]: thirtyDaysAgo } },
  });

  const activeUsers = await db.user.count({
    where: {
      lastLogin: { [db.Sequelize.Op.gte]: thirtyDaysAgo },
    },
  });

  res.status(200).json({
    success: true,
    summary: {
      dailyActiveTenants,
      totalReservations,
      activeUsers,
      periodDays: 30,
    },
  });
};

module.exports = {
  getTenantGrowthMetricsHandler,
  getChurnAnalysisHandler,
  getLtvCacHandler,
  getRevenueAnalyticsHandler,
  getBookingAnalyticsHandler,
  getPaymentAnalyticsHandler,
  getUsageAnalyticsHandler,
};
