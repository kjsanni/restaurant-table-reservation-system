const db = require("../db/models");
const Payment = db.payment;
const { Op, fn, col } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const findByReservation = async (reservationId, tenantId) => {
  return await Payment.findAll({
    where: withTenant({ reservationId }, tenantId),
    order: [["paidAt", "DESC"]],
    attributes: ["id", "reservationId", "amount", "method", "paidBy", "reference", "paidAt", "splits"],
  });
};

const create = async (data, tenantId) => {
  return await Payment.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const updateSplits = async (reservationId, id, splits, tenantId) => {
  const payment = await Payment.findOne({ where: withTenant({ id, reservationId }, tenantId) });
  if (!payment) return null;
  const totalSplit = (splits || []).reduce((sum, split) => sum + parseFloat(split.amount || 0), 0);
  const allowedTotal = parseFloat(payment.amount || 0);
  if (totalSplit > allowedTotal + 0.001 || totalSplit < allowedTotal - 0.001) {
    throw { status: 400, message: `Split amounts must sum to the payment amount (${allowedTotal.toFixed(2)}).` };
  }
  await payment.update({ splits: splits || [] });
  return payment;
};

const getTotalPaid = async (reservationId, tenantId) => {
  const result = await Payment.findOne({
    attributes: [
      [fn("SUM", col("amount")), "total"],
      [fn("SUM", col("discount")), "discountTotal"],
    ],
    where: withTenant({ reservationId }, tenantId),
    raw: true,
  });
  const total = result?.total ? parseFloat(result.total) : 0;
  const discountTotal = result?.discountTotal ? parseFloat(result.discountTotal) : 0;
  return { total, discountTotal, finalTotal: total - discountTotal };
};

const remove = async (reservationId, id, tenantId) => {
  const payment = await Payment.findOne({ where: withTenant({ id, reservationId }, tenantId) });
  if (!payment) return null;
  await payment.destroy();
  return true;
};

const getPaymentHistory = async (filters = {}, tenantId) => {
  const where = withTenant({}, tenantId);
  if (filters.reservationId) where.reservationId = filters.reservationId;
  if (filters.method) where.method = filters.method;
  if (filters.from) where.paidAt = { ...where.paidAt, [Op.gte]: filters.from };
  if (filters.to) where.paidAt = { ...where.paidAt, [Op.lte]: filters.to };

  return await Payment.findAll({
    where,
    include: [
      {
        model: db.reservation,
        attributes: ["id", "resDate", "resTime"],
      },
    ],
    order: [["paidAt", "DESC"]],
  });
};

const getRevenueStats = async (from, to, tenantId) => {
  const where = withTenant({}, tenantId);
  if (from) where.paidAt = { ...where.paidAt, [Op.gte]: from };
  if (to) where.paidAt = { ...where.paidAt, [Op.lte]: to };

  const result = await Payment.findOne({
    attributes: [
      [fn("SUM", col("amount")), "totalRevenue"],
      [fn("SUM", col("discount")), "totalDiscount"],
      [fn("COUNT", col("id")), "totalPayments"],
      [fn("AVG", col("amount")), "avgPayment"],
    ],
    where,
    raw: true,
  });

  const byMethod = await Payment.findAll({
    attributes: [
      "method",
      [fn("SUM", col("amount")), "total"],
      [fn("COUNT", col("id")), "count"],
    ],
    where,
    group: ["method"],
    raw: true,
  });

  const rawRevenue = result?.totalRevenue ? parseFloat(result.totalRevenue) : 0;
  const rawDiscount = result?.totalDiscount ? parseFloat(result.totalDiscount) : 0;
  return {
    totalRevenue: rawRevenue - rawDiscount,
    totalPayments: result?.totalPayments ? parseInt(result.totalPayments, 10) : 0,
    avgPayment: result?.avgPayment ? parseFloat(result.avgPayment) : 0,
    byMethod: byMethod.map((m) => ({
      method: m.method,
      total: parseFloat(m.total),
      count: parseInt(m.count, 10),
    })),
  };
};

const getRevenueTimeSeries = async (from, to, granularity = "day", tenantId) => {
  const where = withTenant({}, tenantId);
  if (from) where.paidAt = { ...where.paidAt, [Op.gte]: from };
  if (to) where.paidAt = { ...where.paidAt, [Op.lte]: to };

  const payments = await Payment.findAll({
    where,
    attributes: ["paidAt", "amount", "discount", "method"],
    order: [["paidAt", "ASC"]],
    raw: true,
  });

  const groups = new Map();
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" });

  for (const p of payments) {
    const d = new Date(p.paidAt);
    const key = fmt.format(d).slice(0, granularity === "month" ? 7 : 10);
    if (!groups.has(key)) groups.set(key, { periodLabel: key, total: 0, count: 0, byMethod: {} });
    const g = groups.get(key);
    const net = parseFloat(p.amount || 0) - parseFloat(p.discount || 0);
    g.total += net;
    g.count += 1;
    if (!g.byMethod[p.method]) g.byMethod[p.method] = { total: 0, count: 0 };
    g.byMethod[p.method].total += net;
    g.byMethod[p.method].count += 1;
  }

  const summary = {
    totalRevenue: Array.from(groups.values()).reduce((s, g) => s + g.total, 0),
    totalPayments: Array.from(groups.values()).reduce((s, g) => s + g.count, 0),
    avgPayment: 0,
  };
  summary.avgPayment = summary.totalPayments ? summary.totalRevenue / summary.totalPayments : 0;

  return {
    series: Array.from(groups.values()).sort((a, b) => a.periodLabel.localeCompare(b.periodLabel)),
    summary,
  };
};

module.exports = {
  findByReservation,
  create,
  updateSplits,
  getTotalPaid,
  remove,
  getPaymentHistory,
  getRevenueStats,
  getRevenueTimeSeries,
};
