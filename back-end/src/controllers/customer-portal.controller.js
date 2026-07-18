const reservationDAO = require("../DAOs/reservation.dao");
const { Op } = require("../db/models");

const getCustomerProfileHandler = async (req, res) => {
  const customer = await reservationDAO.findOrCreateCustomer(
    { email: req.user.email, phone: req.user.phone },
    req.tenant?.id
  );
  return res.status(200).json({ success: true, customer });
};

const updateCustomerProfileHandler = async (req, res) => {
  const customer = await reservationDAO.findOrCreateCustomer(
    { email: req.user.email, phone: req.user.phone },
    req.tenant?.id
  );
  const updated = await reservationDAO.updateCustomer(customer.id, req.body, req.tenant?.id);
  return res.status(200).json({ success: true, customer: updated });
};

const getCustomerReservationsHandler = async (req, res) => {
  const customer = await reservationDAO.findOrCreateCustomer(
    { email: req.user.email, phone: req.user.phone },
    req.tenant?.id
  );
  const reservations = await reservationDAO.findAllReservationsRaw(
    { customerId: customer.id },
    req.tenant?.id
  );
  return res.status(200).json({ success: true, reservations });
};

const cancelReservationHandler = async (req, res) => {
  const { reservationId } = req.params;
  const reservation = await reservationDAO.findReservationById(reservationId, req.tenant?.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }
  if (reservation.resStatus === "cancelled" || reservation.resStatus === "completed") {
    return res.status(400).json({ success: false, message: "Reservation cannot be cancelled" });
  }
  const updated = await reservationDAO.updateReservation(reservationId, { resStatus: "cancelled" }, req.tenant?.id);
  return res.status(200).json({ success: true, reservation: updated });
};

module.exports = {
  getCustomerProfileHandler,
  updateCustomerProfileHandler,
  getCustomerReservationsHandler,
  cancelReservationHandler,
};
