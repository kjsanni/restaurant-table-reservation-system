const db = require("../../db/models");

const revenueDAO = {};

revenueDAO.getMrrTrends = async (months = 12) => {
  const trends = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mrr = await db.tenant.sum(db.sequelize.literal(`
      CASE plan
        ${Object.keys({
          starter: 29,
          growth: 79,
          enterprise: 0,
        })
          .map((slug) => `WHEN '${slug}' THEN ${slug === "enterprise" ? 0 : { starter: 29, growth: 79 }[slug]}`)
          .join("\n        ")}
        ELSE 0
      END
    `), {
      where: {
        status: { [db.Sequelize.Op.in]: ["active", "past_due", "trialing"] },
        createdAt: { [db.Sequelize.Op.lte]: end },
      },
    });
    const newTenants = await db.tenant.count({
      where: {
        status: { [db.Sequelize.Op.in]: ["active", "past_due", "trialing"] },
        createdAt: { [db.Sequelize.Op.gte]: start, [db.Sequelize.Op.lt]: end },
      },
    });
    const cancelled = await db.tenant.count({
      where: {
        status: "cancelled",
        updatedAt: { [db.Sequelize.Op.gte]: start, [db.Sequelize.Op.lt]: end },
      },
    });
    trends.push({
      month: start.toISOString().slice(0, 7),
      mrr: (await mrr) || 0,
      newTenants,
      cancelled,
      churnRate: newtenants > 0 ? Math.round((cancelled / newtenants) * 100) : 0,
    });
  }
  return trends;
};

revenueDAO.getRevenueByPlan = async () => {
  const rows = await db.tenant.findAll({
    attributes: [
      "plan",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      [db.sequelize.fn("SUM", db.sequelize.literal("CASE plan WHEN 'starter' THEN 29 WHEN 'growth' THEN 79 WHEN 'enterprise' THEN 0 ELSE 0 END")), "mrr"],
    ],
    where: { status: { [db.Sequelize.Op.in]: ["active", "past_due", "trialing"] } },
    group: ["plan"],
    raw: false,
  });
  return rows.map((r) => ({
    plan: r.plan,
    count: parseInt(r.get("count"), 10),
    mrr: parseFloat(r.get("mrr") || 0),
  }));
};

revenueDAO.getLtvByTenant = async () => {
  const tenants = await db.tenant.findAll({
    attributes: ["id", "name", "plan", "status", "createdAt", "lastPaymentAt"],
    where: { status: { [db.Sequelize.Op.in]: ["active", "past_due", "trialing"] } },
  });
  return tenants.map((t) => {
    const monthsActive = Math.max(1, Math.round((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const planPrice = { starter: 29, growth: 79, enterprise: 0 }[t.plan] || 0;
    const ltv = planPrice * monthsActive;
    return {
      id: t.id,
      name: t.name,
      plan: t.plan,
      monthsActive,
      ltv,
    };
  });
};

module.exports = revenueDAO;
