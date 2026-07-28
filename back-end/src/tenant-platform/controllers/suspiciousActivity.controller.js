const db = require("../../db/models");

const getSuspiciousActivityHandler = async (req, res) => {
  const suspicious = [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const failedLoginAggregation = await db.loginAttempt.findAll({
    where: {
      attemptedAt: { [db.Sequelize.Op.gte]: thirtyDaysAgo },
    },
    attributes: [
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "attempts"],
      [db.Sequelize.literal("COUNT(DISTINCT ipAddress)"), "distinctIps"],
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
      lastAttemptAt: row.attemptedAt || row.createdAt,
    });
  }

  suspicious.sort((a, b) => new Date(b.lastAttemptAt || 0) - new Date(a.lastAttemptAt || 0));

  res.status(200).json({ success: true, suspicious, total: suspicious.length });
};

module.exports = {
  getSuspiciousActivityHandler,
};
