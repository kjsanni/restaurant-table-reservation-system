const paymentService = require("../services/paymentService");

const getPaymentsHandler = async (req, res) => {
  const { reservationId } = req.params;
  const payments = await paymentService.getPaymentsForReservation(reservationId);
  const totalPaid = await paymentService.getTotalPaid(reservationId);
  return res.status(200).json({ success: true, payments, totalPaid });
};

const addPaymentHandler = async (req, res) => {
  const { reservationId } = req.params;
  const { payment, totalPaid, reservation } = await paymentService.addPayment(reservationId, req.body);
  return res.status(201).json({ success: true, message: "Payment recorded", payment, totalPaid, reservation });
};

const removePaymentHandler = async (req, res) => {
  const { reservationId, paymentId } = req.params;
  const { totalPaid, reservation } = await paymentService.removePayment(reservationId, paymentId);
  return res.status(200).json({ success: true, message: "Payment removed", totalPaid, reservation });
};

const getHistoryHandler = async (req, res) => {
  const filters = {};
  if (req.query.reservationId) filters.reservationId = req.query.reservationId;
  if (req.query.method) filters.method = req.query.method;
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  const history = await paymentService.getPaymentHistory(filters);
  return res.status(200).json({ success: true, history });
};

const getRevenueStatsHandler = async (req, res) => {
  const { from, to } = req.query;
  const stats = await paymentService.getRevenueStats(from, to);
  return res.status(200).json({ success: true, stats });
};

module.exports = {
  getPaymentsHandler,
  addPaymentHandler,
  removePaymentHandler,
  getHistoryHandler,
  getRevenueStatsHandler,
};
