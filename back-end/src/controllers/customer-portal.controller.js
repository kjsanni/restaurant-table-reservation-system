const reservationDAO = require("../DAOs/reservation.dao");
const { Op } = require("../db/models");

const buildCustomerDetails = (user) => {
  const email = user?.email;
  const phone = user?.phone || "";
  const nameParts = (user?.username || email || "Customer")
    .split(" ")
    .filter(Boolean);
  const firstName = nameParts.shift() || (email ? email.split("@")[0] : "Customer");
  const lastName = nameParts.join(" ") || "-";
  return { email, phone, firstName, lastName };
};

const getCustomerProfileHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer profile linked to this account",
      });
    }
    return res.status(200).json({ success: true, customer });
  } catch (err) {
    console.error("getCustomerProfileHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

const updateCustomerProfileHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer profile linked to this account",
      });
    }
    const updated = await reservationDAO.updateCustomer(customer.id, req.body, req.tenant?.id);
    return res.status(200).json({ success: true, customer: updated });
  } catch (err) {
    console.error("updateCustomerProfileHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const getCustomerReservationsHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(200).json({ success: true, reservations: [] });
    }
    const reservations = await reservationDAO.findAllReservationsRaw(
      { customerId: customer.id },
      req.tenant?.id
    );
    return res.status(200).json({ success: true, reservations });
  } catch (err) {
    console.error("getCustomerReservationsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load reservations" });
  }
};

const cancelReservationHandler = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("cancelReservationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel reservation" });
  }
};

module.exports = {
  getCustomerProfileHandler,
  updateCustomerProfileHandler,
  getCustomerReservationsHandler,
  cancelReservationHandler,
};
