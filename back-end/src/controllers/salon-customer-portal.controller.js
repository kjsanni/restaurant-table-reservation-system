"use strict";
const reservationDAO = require("../DAOs/reservation.dao");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");

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

const getSalonCustomerProfileHandler = async (req, res) => {
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
    console.error("getSalonCustomerProfileHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

const getSalonCustomerAppointmentsHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(200).json({ success: true, appointments: [] });
    }
    const result = await appointmentDao.findAllForTenant(req.tenant?.id, {
      customerId: customer.id,
    });
    return res.status(200).json({ success: true, appointments: result.data });
  } catch (err) {
    console.error("getSalonCustomerAppointmentsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load appointments" });
  }
};

const cancelSalonAppointmentHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentDao.findById(appointmentId, req.tenant?.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (appointment.status === "cancelled" || appointment.status === "completed") {
      return res.status(400).json({ success: false, message: "Appointment cannot be cancelled" });
    }
    const updated = await appointmentDao.update(appointmentId, req.tenant?.id, { status: "cancelled" });
    return res.status(200).json({ success: true, appointment: updated });
  } catch (err) {
    console.error("cancelSalonAppointmentHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel appointment" });
  }
};

module.exports = {
  getSalonCustomerProfileHandler,
  getSalonCustomerAppointmentsHandler,
  cancelSalonAppointmentHandler,
};
