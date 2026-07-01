const db = require("../db/models");
const Payment = db.payment;
const { Op, fn, col } = db.Sequelize;

const findByReservation = async (reservationId) => {
  return await Payment.findAll({
    where: { reservationId },
    order: [["paidAt", "DESC"]],
  });
};

const create = async (data) => {
  return await Payment.create(data);
};

const getTotalPaid = async (reservationId) => {
  const result = await Payment.findOne({
    attributes: [
      [fn("SUM", col("amount")), "total"],
      [fn("SUM", col("discount")), "discountTotal"],
    ],
    where: { reservationId },
    raw: true,
  });
  const total = result?.total ? parseFloat(result.total) : 0;
  const discountTotal = result?.discountTotal ? parseFloat(result.discountTotal) : 0;
  return { total, discountTotal, finalTotal: total - discountTotal };
};

const remove = async (reservationId, id) => {
  const payment = await Payment.findOne({ where: { id, reservationId } });
  if (!payment) return null;
  await payment.destroy();
  return true;
};

const getPaymentHistory = async (filters = {}) => {
  const where = {};
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

const getRevenueStats = async (from, to) => {
  const where = {};
  if (from) where.paidAt = { ...where.paidAt, [Op.gte]: from };
  if (to) where.paidAt = { ...where.paidAt, [Op.lte]: to };

  const result = await Payment.findOne({
    attributes: [
      [fn("SUM", col("amount")), "totalRevenue"],
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

  return {
    totalRevenue: result?.totalRevenue ? parseFloat(result.totalRevenue) : 0,
    totalPayments: result?.totalPayments ? parseInt(result.totalPayments, 10) : 0,
    avgPayment: result?.avgPayment ? parseFloat(result.avgPayment) : 0,
    byMethod: byMethod.map((m) => ({
      method: m.method,
      total: parseFloat(m.total),
      count: parseInt(m.count, 10),
    })),
  };
};

module.exports = {
  findByReservation,
  create,
  getTotalPaid,
  remove,
  getPaymentHistory,
  getRevenueStats,
};
