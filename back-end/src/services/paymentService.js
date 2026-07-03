const paymentDAO = require("../DAOs/payment.dao");
const reservationDAO = require("../DAOs/reservation.dao");

const classifyPaymentStatus = (totalPaid, expectedTotal) => {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= parseFloat(expectedTotal || 0)) return "paid";
  return "deposit";
};

const getPaymentsForReservation = async (reservationId) => {
  return await paymentDAO.findByReservation(reservationId);
};

const addPayment = async (reservationId, data) => {
  if (!data.amount || parseFloat(data.amount) <= 0) {
    throw { status: 400, message: "Invalid payment amount" };
  }

  const splits = Array.isArray(data.splits) ? data.splits : [];
  const sanitizedSplits = splits.map((split) => ({
    method: split.method || data.method || "cash",
    amount: parseFloat(split.amount || 0),
    paidBy: split.paidBy || null,
    reference: split.reference || null,
    tip: split.tip ? parseFloat(split.tip) : 0,
  }));

  const totalSplit = sanitizedSplits.reduce((sum, split) => sum + split.amount, 0);
  const paymentAmount = parseFloat(data.amount);
  if (sanitizedSplits.length > 0 && Math.abs(totalSplit - paymentAmount) > 0.01) {
    throw { status: 400, message: `Split amounts (${totalSplit.toFixed(2)}) must equal the payment amount (${paymentAmount.toFixed(2)}).` };
  }

  const payment = await paymentDAO.create({
    ...data,
    reservationId,
    amount: paymentAmount,
    method: sanitizedSplits.length > 0 ? "split" : data.method,
    splits: sanitizedSplits.length > 0 ? sanitizedSplits : undefined,
  });

  const paidInfo = await paymentDAO.getTotalPaid(reservationId);
  const reservation = await reservationDAO.findReservationById(reservationId);
  let updatedReservation = null;
  if (reservation) {
    const expectedTotal = reservation.expectedTotal || 0;
    const finalPaid = paidInfo.finalTotal;
    const newStatus = classifyPaymentStatus(finalPaid, expectedTotal);
    if (reservation.paymentStatus !== newStatus) {
      await reservationDAO.updateReservation(reservationId, {
        paymentStatus: newStatus,
      });
      reservation.paymentStatus = newStatus;
    }
    updatedReservation = reservation;
  }

  return { payment, ...paidInfo, reservation: updatedReservation };
};

const getTotalPaid = async (reservationId) => {
  return await paymentDAO.getTotalPaid(reservationId);
};

const removePayment = async (reservationId, id) => {
  await paymentDAO.remove(reservationId, id);
  const paidInfo = await paymentDAO.getTotalPaid(reservationId);
  const reservation = await reservationDAO.findReservationById(reservationId);
  let updatedReservation = null;
  if (reservation) {
    const expectedTotal = reservation.expectedTotal || 0;
    const finalPaid = paidInfo.finalTotal;
    const newStatus = classifyPaymentStatus(finalPaid, expectedTotal);
    if (reservation.paymentStatus !== newStatus) {
      await reservationDAO.updateReservation(reservationId, {
        paymentStatus: newStatus,
      });
      reservation.paymentStatus = newStatus;
    }
    updatedReservation = reservation;
  }
  return { ...paidInfo, reservation: updatedReservation };
};

const refundPayment = async (reservationId, paymentId, data) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    throw { status: 404, message: "Payment not found" };
  }

  const existing = await refundDAO.findByIdempotencyKey(data.idempotencyKey);
  if (existing) {
    return { refund: existing, skipped: true };
  }

  const refundAmount = parseFloat(data.amount || 0);
  const paymentAmount = parseFloat(payment.amount || 0);
  if (refundAmount <= 0 || refundAmount > paymentAmount) {
    throw { status: 400, message: "Invalid refund amount" };
  }

  const refund = await refundDAO.createRefund({
    paymentId,
    amount: refundAmount,
    reason: data.reason || null,
    status: "pending",
    refundedBy: data.refundedBy || null,
    idempotencyKey: data.idempotencyKey || null,
  });

  return { refund, skipped: false };
};

const getPaymentHistory = async (filters = {}) => {
  return await paymentDAO.getPaymentHistory(filters);
};

const getRevenueStats = async (from, to) => {
  return await paymentDAO.getRevenueStats(from, to);
};

module.exports = {
  getPaymentsForReservation,
  addPayment,
  getTotalPaid,
  removePayment,
  refundPayment,
  getPaymentHistory,
  getRevenueStats,
};
