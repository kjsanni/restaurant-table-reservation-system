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

module.exports = {
  getTenantGrowthMetricsHandler,
  getChurnAnalysisHandler,
  getLtvCacHandler,
};
