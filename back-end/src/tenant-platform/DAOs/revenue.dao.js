const db = require("../../db/models");

const revenueDAO = {};

revenueDAO.getMrrTrends = async (months = 12) => {
  const trends = [];
  const now = new Date();
  const plans = await db.subscriptionPlan.findAll({
    where: { isActive: true },
    raw: true,
  });
  const planPriceMap = {};
  for (const plan of plans) {
    planPriceMap[plan.slug] = parseFloat(plan.price || 0);
  }

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mrrResult = await db.sequelize.query(
      `SELECT COALESCE(SUM(CASE plan WHEN :starter THEN :starterPrice WHEN :growth THEN :growthPrice WHEN :enterprise THEN :enterprisePrice ELSE 0 END), 0) AS mrr FROM tenants WHERE status IN ('active', 'past_due', 'trialing') AND createdAt <= :end`,
      {
        replacements: {
          starter: "starter",
          starterPrice: planPriceMap.starter || 0,
          growth: "growth",
          growthPrice: planPriceMap.growth || 0,
          enterprise: "enterprise",
          enterprisePrice: planPriceMap.enterprise || 0,
          end,
        },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );
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
    const mrr = mrrResult[0]?.mrr || 0;
    trends.push({
      month: start.toISOString().slice(0, 7),
      mrr,
      newTenants,
      cancelled,
      churnRate: newTenants > 0 ? Math.round((cancelled / newTenants) * 100) : 0,
    });
  }
  return trends;
};

revenueDAO.getRevenueByPlan = async () => {
  const plans = await db.subscriptionPlan.findAll({
    where: { isActive: true },
    raw: true,
  });
  const planPriceMap = {};
  for (const plan of plans) {
    planPriceMap[plan.slug] = parseFloat(plan.price || 0);
  }

  const rows = await db.sequelize.query(
    `SELECT plan, COUNT(id) AS count, SUM(CASE plan WHEN :starter THEN :starterPrice WHEN :growth THEN :growthPrice WHEN :enterprise THEN :enterprisePrice ELSE 0 END) AS mrr FROM tenants WHERE status IN ('active', 'past_due', 'trialing') GROUP BY plan`,
    {
      replacements: {
        starter: "starter",
        starterPrice: planPriceMap.starter || 0,
        growth: "growth",
        growthPrice: planPriceMap.growth || 0,
        enterprise: "enterprise",
        enterprisePrice: planPriceMap.enterprise || 0,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    }
  );
  return rows.map((r) => ({
    plan: r.plan,
    count: parseInt(r.count, 10),
    mrr: parseFloat(r.mrr || 0),
  }));
};

revenueDAO.getLtvByTenant = async () => {
  const tenants = await db.tenant.findAll({
    attributes: ["id", "name", "plan", "status", "createdAt", "lastPaymentAt"],
    where: { status: { [db.Sequelize.Op.in]: ["active", "past_due", "trialing"] } },
  });
  const plans = await db.subscriptionPlan.findAll({
    where: { isActive: true },
    raw: true,
  });
  const planPriceMap = {};
  for (const plan of plans) {
    planPriceMap[plan.slug] = parseFloat(plan.price || 0);
  }
  return tenants.map((t) => {
    const monthsActive = Math.max(1, Math.round((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const planPrice = planPriceMap[t.plan] || 0;
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
