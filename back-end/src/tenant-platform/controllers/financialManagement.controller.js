const db = require("../../db/models");
const refundDAO = require("../../DAOs/refund.dao");
const paymentDAO = require("../../DAOs/payment.dao");

const listRefundsHandler = async (req, res) => {
  const { status, tenantId, from, to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (tenantId) where.tenantId = parseInt(tenantId, 10);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const refunds = await db.refund.findAll({
    where,
    include: [
      { model: db.payment, as: "payment", attributes: ["id", "amount", "method", "reference"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 100,
  });

  res.status(200).json({ success: true, collection: refunds });
};

const updateRefundStatusHandler = async (req, res) => {
  const refund = await db.refund.findByPk(req.params.id);
  if (!refund) {
    return res.status(404).json({ success: false, message: "Refund not found" });
  }
  const { status } = req.body;
  if (!["pending", "succeeded", "failed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  await refund.update({ status });
  res.status(200).json({ success: true, item: refund });
};

const getSubscriptionHealthHandler = async (req, res) => {
  const tenants = await db.tenant.findAll({
    attributes: ["id", "name", "status", "subscriptionStatus", "plan", "currentPeriodEnd", "graceEndsAt", "cancelAtPeriodEnd"],
  });

  const health = tenants.map((t) => {
    const now = new Date();
    const periodEnd = t.currentPeriodEnd ? new Date(t.currentPeriodEnd) : null;
    const graceEnd = t.graceEndsAt ? new Date(t.graceEndsAt) : null;
    const daysToPeriodEnd = periodEnd ? Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)) : null;
    const daysToGraceEnd = graceEnd ? Math.ceil((graceEnd - now) / (1000 * 60 * 60 * 24)) : null;

    let risk = "healthy";
    if (t.status === "suspended" || t.subscriptionStatus === "cancelled") risk = "critical";
    else if (t.status === "past_due" || t.cancelAtPeriodEnd) risk = "warning";
    else if (daysToPeriodEnd !== null && daysToPeriodEnd <= 7) risk = "at_risk";

    return {
      id: t.id,
      name: t.name,
      status: t.status,
      subscriptionStatus: t.subscriptionStatus,
      plan: t.plan,
      daysToPeriodEnd,
      daysToGraceEnd,
      cancelAtPeriodEnd: t.cancelAtPeriodEnd,
      risk,
    };
  });

  const summary = {
    total: health.length,
    healthy: health.filter((h) => h.risk === "healthy").length,
    atRisk: health.filter((h) => h.risk === "at_risk").length,
    warning: health.filter((h) => h.risk === "warning").length,
    critical: health.filter((h) => h.risk === "critical").length,
  };

  res.status(200).json({ success: true, summary, collection: health });
};

const detectFinancialAnomaliesHandler = async (req, res) => {
  const largeRefunds = await db.refund.findAll({
    where: { status: "succeeded" },
    include: [
      { model: db.payment, as: "payment", attributes: ["id", "amount", "tenantId"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  const anomalies = [];
  for (const refund of largeRefunds) {
    const paymentAmount = parseFloat(refund.payment?.amount || 0);
    const refundAmount = parseFloat(refund.amount || 0);
    if (paymentAmount > 0 && refundAmount / paymentAmount > 0.5) {
      anomalies.push({
        type: "large_refund",
        refundId: refund.id,
        tenantId: refund.tenantId,
        paymentId: refund.paymentId,
        amount: refundAmount,
        ratio: Math.round((refundAmount / paymentAmount) * 100) / 100,
      });
    }
  }

  res.status(200).json({ success: true, collection: anomalies.slice(0, 20) });
};

module.exports = {
  listRefundsHandler,
  updateRefundStatusHandler,
  getSubscriptionHealthHandler,
  detectFinancialAnomaliesHandler,
};
