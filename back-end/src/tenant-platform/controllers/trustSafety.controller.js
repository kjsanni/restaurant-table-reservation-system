const db = require("../../db/models");

const getTenantHealthScoresHandler = async (req, res) => {
  const tenants = await db.tenant.findAll({
    where: { status: { [db.Sequelize.Op.ne]: "cancelled" } },
    attributes: ["id", "name", "status", "plan", "monthlyRevenue", "createdAt"],
  });

  const scores = await Promise.all(
    tenants.map(async (tenant) => {
      const [failedPayments, openTickets, recentLogins] = await Promise.all([
        db.platformAuditLog.count({
          where: {
            tenantId: tenant.id,
            action: { [db.Sequelize.Op.like]: "payment.failed%" },
            createdAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        db.supportTicket.count({
          where: {
            tenantId: tenant.id,
            status: { [db.Sequelize.Op.in]: ["open", "pending"] },
          },
        }),
        db.platformAuditLog.count({
          where: {
            tenantId: tenant.id,
            action: "auth.login",
            createdAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      let score = 100;
      score -= Math.min(failedPayments * 10, 30);
      score -= Math.min(openTickets * 5, 20);
      score += Math.min(recentLogins * 2, 10);
      if (tenant.status === "suspended") score -= 40;
      score = Math.max(0, Math.min(100, score));

      let risk = "low";
      if (score < 60) risk = "high";
      else if (score < 80) risk = "medium";

      return {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        score,
        risk,
        failedPayments,
        openTickets,
        recentLogins,
      };
    })
  );

  const summary = {
    total: scores.length,
    healthy: scores.filter((s) => s.risk === "low").length,
    atRisk: scores.filter((s) => s.risk === "medium" || s.risk === "high").length,
    highRisk: scores.filter((s) => s.risk === "high").length,
  };

  res.status(200).json({ success: true, summary, collection: scores });
};

module.exports = {
  getTenantHealthScoresHandler,
};
