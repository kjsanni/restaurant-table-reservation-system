const db = require("../../db/models");

const revenueDAO = {};

revenueDAO.getMrrTrends = async (months = 12) => {
  const trends = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mrrResult = await db.sequelize.query(
      `SELECT COALESCE(SUM(CASE plan WHEN 'starter' THEN 29 WHEN 'growth' THEN 79 WHEN 'enterprise' THEN 0 ELSE 0 END), 0) AS mrr FROM tenants WHERE status IN ('active', 'past_due', 'trialing') AND createdAt <= :end`,
      { replacements: { end }, type: db.Sequelize.QueryTypes.SELECT }
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
  const rows = await db.sequelize.query(
    `SELECT plan, COUNT(id) AS count, SUM(CASE plan WHEN 'starter' THEN 29 WHEN 'growth' THEN 79 WHEN 'enterprise' THEN 0 ELSE 0 END) AS mrr FROM tenants WHERE status IN ('active', 'past_due', 'trialing') GROUP BY plan`,
    { type: db.Sequelize.QueryTypes.SELECT }
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
