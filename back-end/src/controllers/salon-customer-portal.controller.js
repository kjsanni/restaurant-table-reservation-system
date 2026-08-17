"use strict";
const reservationDAO = require("../DAOs/reservation.dao");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const giftCardDao = require("../verticals/salon/DAOs/giftCard.dao");
const referralDao = require("../verticals/salon/DAOs/referral.dao");
const servicePackageDao = require("../verticals/salon/DAOs/servicePackage.dao");
const pricingRuleDao = require("../verticals/salon/DAOs/pricingRule.dao");

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

    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );

    if (appointment.customerId !== customer.id && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "You do not have permission to cancel this appointment" });
    }

    const updated = await appointmentDao.update(appointmentId, req.tenant?.id, { status: "cancelled" }); // codacy-suppress nosql-injection - parameterized ORM call
    return res.status(200).json({ success: true, appointment: updated });
  } catch (err) {
    console.error("cancelSalonAppointmentHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel appointment" });
  }
};

const rebookSalonAppointmentHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentDao.findById(appointmentId, req.tenant?.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (!["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: "Only completed or cancelled appointments can be rebooked" });
    }

    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );

    if (appointment.customerId !== customer.id && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "You do not have permission to rebook this appointment" });
    }

    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const durationMinutes = appointment.durationMinutes || 30;
    const bufferMinutes = appointment.bufferMinutes || 0;
    const end = new Date(start.getTime() + (durationMinutes + bufferMinutes) * 60000);

    const newAppointment = await appointmentDao.create({ // codacy-suppress nosql-injection - parameterized ORM call
      tenantId: req.tenant?.id,
      customerId: customer.id,
      serviceId: appointment.serviceId,
      stylistId: appointment.stylistId,
      stationId: appointment.stationId,
      start: start.toISOString(),
      end: end.toISOString(),
      durationMinutes,
      bufferMinutes,
      status: "confirmed",
      paymentStatus: "unpaid",
      depositAmount: 0,
      source: "web",
      notes: `Rebooked from appointment #${appointment.id}`,
    });

    return res.status(200).json({ success: true, appointment: newAppointment });
  } catch (err) {
    console.error("rebookSalonAppointmentHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to rebook appointment" });
  }
};

const getCustomerGiftCardsHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(200).json({ success: true, giftCards: [] });
    }
    const giftCards = await giftCardDao.findAll(req.tenant?.id, {}); // codacy-suppress nosql-injection - parameterized ORM call
    const customerCards = giftCards.filter(
      (card) => card.purchasedByCustomerId === customer.id || card.redeemedByCustomerId === customer.id
    );
    return res.status(200).json({ success: true, giftCards: customerCards });
  } catch (err) {
    console.error("getCustomerGiftCardsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load gift cards" });
  }
};

const getCustomerReferralsHandler = async (req, res) => {
  try {
    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );
    if (!customer) {
      return res.status(200).json({ success: true, referrals: [] });
    }
    const referrals = await referralDao.findAll(req.tenant?.id, {}); // codacy-suppress nosql-injection - parameterized ORM call
    const customerReferrals = referrals.filter(
      (r) => r.referrerCustomerId === customer.id || r.refereeCustomerId === customer.id
    );
    return res.status(200).json({ success: true, referrals: customerReferrals });
  } catch (err) {
    console.error("getCustomerReferralsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load referrals" });
  }
};

const listServicePackagesHandler = async (req, res) => {
  try {
    const packages = await servicePackageDao.findAll(req.tenant?.id, {}); // codacy-suppress nosql-injection - parameterized ORM call
    return res.status(200).json({ success: true, packages });
  } catch (err) {
    console.error("listServicePackagesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load packages" });
  }
};

const listPricingRulesHandler = async (req, res) => {
  try {
    const rules = await pricingRuleDao.findAll(req.tenant?.id, { isActive: true }); // codacy-suppress nosql-injection - parameterized ORM call
    return res.status(200).json({ success: true, rules });
  } catch (err) {
    console.error("listPricingRulesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load pricing rules" });
  }
};

module.exports = {
  getSalonCustomerProfileHandler,
  getSalonCustomerAppointmentsHandler,
  cancelSalonAppointmentHandler,
  rebookSalonAppointmentHandler,
  getCustomerGiftCardsHandler,
  getCustomerReferralsHandler,
  listServicePackagesHandler,
  listPricingRulesHandler,
};
