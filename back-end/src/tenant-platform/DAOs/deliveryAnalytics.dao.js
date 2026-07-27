const db = require("../../db/models");

const deliveryAnalyticsDAO = {};

deliveryAnalyticsDAO.getWhatsAppDeliveryFailures = async (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.from) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.gte]: new Date(filters.from) };
  if (filters.to) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: new Date(filters.to) };

  const deliveries = await db.delivery.findAll({
    where,
    attributes: [
      "tenantId",
      "status",
      "deliveryAttempts",
      "statusDescription",
      "trackingHistory",
      "callLogs",
      "createdAt",
    ],
    raw: true,
  });

  const failed = deliveries.filter((d) => d.status === "failed" || d.deliveryAttempts > 0);
  const failureReasons = {};
  const retrySuccess = { attempted: 0, succeeded: 0 };
  const costImpact = { totalFailed: 0, retryCost: 0 };

  for (const d of failed) {
    const reason = d.statusDescription || "unknown";
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;

    retrySuccess.attempted += d.deliveryAttempts || 0;
    if (d.status === "delivered") {
      retrySuccess.succeeded += d.deliveryAttempts || 0;
    }

    costImpact.totalFailed += 1;
    costImpact.retryCost += (d.deliveryAttempts || 0) * 0.5;
  }

  return {
    totalDeliveries: deliveries.length,
    failedCount: failed.length,
    failureReasons,
    retrySuccess,
    costImpact,
  };
};

module.exports = deliveryAnalyticsDAO;
