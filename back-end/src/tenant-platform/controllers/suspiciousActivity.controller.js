const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const getSuspiciousActivityHandler = async (req, res) => {
  const suspicious = [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const failedLoginAggregation = await db.loginAttempt.findAll({
    where: {
      success: false,
      createdAt: { [db.Sequelize.Op.gte]: thirtyDaysAgo },
    },
    attributes: [
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "attempts"],
      [db.Sequelize.fn("COUNT", db.Sequelize.fn("DISTINCT", db.Sequelize.col("ipAddress")), "distinctIps")],
      "email",
      "ipAddress",
    ],
    group: ["email", "ipAddress"],
    having: db.Sequelize.literal("COUNT(id) >= 5"),
    order: [[db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "DESC"]],
    limit: 50,
  });

  for (const row of failedLoginAggregation) {
    suspicious.push({
      type: "brute_force",
      email: row.email,
      ipAddress: row.ipAddress,
      attempts: parseInt(row.attempts, 10),
      distinctIps: parseInt(row.distinctIps, 10),
      severity: parseInt(row.attempts, 10) > 20 ? "high" : "medium",
    });
  }

  const recentLockouts = await db.loginAttempt.findAll({
    where: {
      lockedOut: true,
      createdAt: { [db.Sequelize.Op.gte]: thirtyDaysAgo },
    },
    include: [
      { model: db.user, as: "user", attributes: ["id", "email", "name", "tenantId"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  for (const lockout of recentLockouts) {
    suspicious.push({
      type: "account_lockout",
      userId: lockout.user?.id,
      email: lockout.user?.email,
      tenantId: lockout.user?.tenantId,
      ipAddress: lockout.ipAddress,
      lockedAt: lockout.createdAt,
      severity: "high",
    });
  }

  suspicious.sort((a, b) => new Date(b.lockedAt || b.createdAt || 0) - new Date(a.lockedAt || a.createdAt || 0));

  res.status(200).json({ success: true, suspicious, total: suspicious.length });
};

module.exports = {
  getSuspiciousActivityHandler,
};
