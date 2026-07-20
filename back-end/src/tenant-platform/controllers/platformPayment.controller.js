const db = require("../../db/models");
const { Op } = require("sequelize");

const platformPaymentController = {};

platformPaymentController.getSummary = async (req, res) => {
  const { from, to, plan, status } = req.query;

  const tenantWhere = {};
  if (plan) tenantWhere.plan = plan;
  if (status) tenantWhere.status = status;

  const tenants = await db.tenant.findAll({
    where: tenantWhere,
    attributes: ["id", "name", "slug", "plan", "status", "subscriptionStatus", "currentPeriodEnd", "lastPaymentAt", "createdAt"],
  });

  const tenantIds = tenants.map((t) => t.id);

  let reservationWhere = {};
  if (tenantIds.length > 0) {
    reservationWhere.tenantId = { [Op.in]: tenantIds };
  }
  if (from) reservationWhere.createdAt = { ...reservationWhere.createdAt, [Op.gte]: new Date(from) };
  if (to) reservationWhere.createdAt = { ...reservationWhere.createdAt, [Op.lte]: new Date(to) };

  const paymentBreakdown = await db.reservation.findAll({
    where: reservationWhere,
    attributes: [
      "tenantId",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      [db.sequelize.fn("SUM", db.sequelize.col("expectedTotal")), "totalExpected"],
    ],
    group: ["tenantId", "paymentStatus"],
    raw: false,
  });

  const paymentStats = await db.payment.findAll({
    where: { tenantId: { [Op.in]: tenantIds } },
    attributes: [
      "tenantId",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"],
    ],
    group: ["tenantId"],
  });

  const recentPayments = await db.payment.findAll({
    where: { tenantId: { [Op.in]: tenantIds } },
    order: [["createdAt", "DESC"]],
    limit: 50,
    include: [
      { model: db.reservation, as: "reservation", attributes: ["id", "resDate", "resTime"], required: false },
    ],
  });

  const tenantMap = {};
  for (const t of tenants) {
    tenantMap[t.id] = { id: t.id, name: t.name, slug: t.slug };
  }

  const breakdown = {};
  for (const row of paymentBreakdown) {
    const tid = row.tenantId;
    if (!breakdown[tid]) breakdown[tid] = { tenantId: tid, tenantName: tenantMap[tid]?.name, tenantSlug: tenantMap[tid]?.slug, counts: {}, totalExpected: 0 };
    breakdown[tid].counts[row.paymentStatus || "unpaid"] = parseInt(row.get("count"), 10);
    breakdown[tid].totalExpected += parseFloat(row.get("totalExpected") || 0);
  }

  const paymentTotals = {};
  for (const row of paymentStats) {
    paymentTotals[row.tenantId] = { count: parseInt(row.get("count"), 10), totalAmount: parseFloat(row.get("totalAmount") || 0) };
  }

  const tenantSummaries = tenants.map((t) => {
    const stats = breakdown[t.id] || { counts: {}, totalExpected: 0 };
    const pt = paymentTotals[t.id] || { count: 0, totalAmount: 0 };
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      status: t.status,
      subscriptionStatus: t.subscriptionStatus,
      currentPeriodEnd: t.currentPeriodEnd,
      lastPaymentAt: t.lastPaymentAt,
      reservationCounts: stats.counts,
      totalExpected: stats.totalExpected,
      paymentsCollected: pt.totalAmount,
      paymentCount: pt.count,
    };
  });

  const totals = tenantSummaries.reduce(
    (acc, t) => {
      acc.totalTenants += 1;
      acc.totalExpected += t.totalExpected;
      acc.totalCollected += t.paymentsCollected;
      acc.totalOutstanding += t.totalExpected - t.paymentsCollected;
      if (t.status === "active") acc.active += 1;
      else acc.inactive += 1;
      if (t.subscriptionStatus === "past_due") acc.pastDue += 1;
      if (t.status === "suspended") acc.suspended += 1;
      return acc;
    },
    { totalTenants: 0, active: 0, inactive: 0, pastDue: 0, suspended: 0, totalExpected: 0, totalCollected: 0, totalOutstanding: 0 }
  );

  res.status(200).json({
    success: true,
    totals,
    tenants: tenantSummaries,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: parseFloat(p.amount),
      method: p.method,
      paidBy: p.paidBy,
      reference: p.reference,
      createdAt: p.createdAt,
      tenant: tenantMap[p.tenantId] || null,
      reservation: p.reservation ? { id: p.reservation.id, resDate: p.reservation.resDate, resTime: p.reservation.resTime } : null,
    })),
  });
};

module.exports = {
  getSummary: platformPaymentController.getSummary,
};
