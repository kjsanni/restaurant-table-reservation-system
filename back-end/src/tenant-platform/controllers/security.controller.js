const db = require("../../db/models");
const loginAttemptDAO = require("../../DAOs/loginAttempt.dao");

const getBruteForceAggregationHandler = async (req, res) => {
  const { from, to } = req.query;
  const startDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(to) : new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ success: false, message: "Invalid date range" });
  }

  const { Op } = db.Sequelize;
  const attempts = await db.loginAttempt.findAll({
    where: {
      attemptedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      },
    },
    attributes: [
      "email",
      "ipAddress",
      [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "attemptCount"],
      [db.Sequelize.fn("MAX", db.Sequelize.col("attemptedAt")), "lastAttempt"],
    ],
    group: ["email", "ipAddress"],
    having: db.Sequelize.literal(`COUNT(id) >= 5`),
    order: [[db.Sequelize.literal("attemptCount"), "DESC"]],
    limit: 100,
    raw: true,
  });

  const aggregation = attempts.map((row) => ({
    email: row.email,
    ipAddress: row.ipAddress,
    attemptCount: parseInt(row.attemptCount, 10),
    lastAttempt: row.lastAttempt,
  }));

  res.status(200).json({
    success: true,
    range: { from: startDate.toISOString(), to: endDate.toISOString() },
    collection: aggregation,
  });
};

module.exports = {
  getBruteForceAggregationHandler,
};
