const paymentDAO = require("../DAOs/payment.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const db = require("../db/models");
const Payment = db.payment;
const refundDAO = require("../DAOs/refund.dao");

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const classifyPaymentStatus = (totalPaid, expectedTotal) => {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= parseFloat(expectedTotal || 0)) return "paid";
  return "deposit";
};

const getPaymentsForReservation = async (reservationId, tenantId) => {
  return await paymentDAO.findByReservation(reservationId, tenantId);
};

const addPayment = async (reservationId, data, tenantId) => {
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
  }, tenantId);

  const paidInfo = await paymentDAO.getTotalPaid(reservationId, tenantId);
  const reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  let updatedReservation = null;
  if (reservation) {
    const expectedTotal = reservation.expectedTotal || 0;
    const finalPaid = paidInfo.finalTotal;
    const newStatus = classifyPaymentStatus(finalPaid, expectedTotal);
    if (reservation.paymentStatus !== newStatus) {
      await reservationDAO.updateReservation(reservationId, {
        paymentStatus: newStatus,
      }, tenantId);
      reservation.paymentStatus = newStatus;
    }
    updatedReservation = reservation;
  }

  return { payment, ...paidInfo, reservation: updatedReservation };
};

const getTotalPaid = async (reservationId, tenantId) => {
  return await paymentDAO.getTotalPaid(reservationId, tenantId);
};

const removePayment = async (reservationId, id, tenantId) => {
  await paymentDAO.remove(reservationId, id, tenantId);
  const paidInfo = await paymentDAO.getTotalPaid(reservationId, tenantId);
  const reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  let updatedReservation = null;
  if (reservation) {
    const expectedTotal = reservation.expectedTotal || 0;
    const finalPaid = paidInfo.finalTotal;
    const newStatus = classifyPaymentStatus(finalPaid, expectedTotal);
    if (reservation.paymentStatus !== newStatus) {
      await reservationDAO.updateReservation(reservationId, {
        paymentStatus: newStatus,
      }, tenantId);
      reservation.paymentStatus = newStatus;
    }
    updatedReservation = reservation;
  }
  return { ...paidInfo, reservation: updatedReservation };
};

const refundPayment = async (reservationId, paymentId, data, tenantId) => {
  const payment = await Payment.findOne({
    where: withTenant({ id: paymentId }, tenantId),
  });
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
  }, tenantId);

  return { refund, skipped: false };
};

const getPaymentHistory = async (filters = {}, tenantId, pagination = {}) => {
  return await paymentDAO.getPaymentHistory(filters, tenantId, pagination);
};

const getRevenueStats = async (from, to, tenantId) => {
  return await paymentDAO.getRevenueStats(from, to, tenantId);
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
