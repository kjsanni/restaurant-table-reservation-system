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
  const payment = await paymentDAO.create({
    ...data,
    reservationId,
    amount: parseFloat(data.amount),
  });

  const totalPaid = await paymentDAO.getTotalPaid(reservationId);
  const reservation = await reservationDAO.findReservationById(reservationId);
  let updatedReservation = null;
  if (reservation) {
    const expectedTotal = reservation.expectedTotal || 0;
    const newStatus = classifyPaymentStatus(totalPaid, expectedTotal);
    if (reservation.paymentStatus !== newStatus) {
      await reservationDAO.updateReservation(reservationId, {
        paymentStatus: newStatus,
      });
      reservation.paymentStatus = newStatus;
    }
    updatedReservation = reservation;
  }

  return { payment, totalPaid, reservation: updatedReservation };
};

const getTotalPaid = async (reservationId) => {
  return await paymentDAO.getTotalPaid(reservationId);
};

const removePayment = async (reservationId, id) => {
  await paymentDAO.remove(reservationId, id);
  const totalPaid = await paymentDAO.getTotalPaid(reservationId);
  const reservation = await reservationDAO.findReservationById(reservationId);
  let updatedReservation = null;
  if (reservation) {
    const expectedTotal = reservation.expectedTotal || 0;
    const newStatus = classifyPaymentStatus(totalPaid, expectedTotal);
    if (reservation.paymentStatus !== newStatus) {
      await reservationDAO.updateReservation(reservationId, {
        paymentStatus: newStatus,
      });
      reservation.paymentStatus = newStatus;
    }
    updatedReservation = reservation;
  }
  return { totalPaid, reservation: updatedReservation };
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
  getPaymentHistory,
  getRevenueStats,
};
