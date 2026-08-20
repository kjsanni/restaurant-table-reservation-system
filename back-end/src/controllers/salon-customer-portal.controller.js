"use strict";
const reservationDAO = require("../DAOs/reservation.dao");
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const giftCardDao = require("../verticals/salon/DAOs/giftCard.dao");
const referralDao = require("../verticals/salon/DAOs/referral.dao");
const servicePackageDao = require("../verticals/salon/DAOs/servicePackage.dao");
const pricingRuleDao = require("../verticals/salon/DAOs/pricingRule.dao");
const { localizedResponse, localizedError } = require("../utils/localizedResponse");

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
      return localizedError(req, res, 404, "common.profileLinkedToAccount");
    }
    return localizedResponse(req, res, 200, "common.success", {}, customer);
  } catch (err) {
    console.error("getSalonCustomerProfileHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadProfile");
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
      return localizedResponse(req, res, 200, "common.success", {}, []);
    }
    const result = await appointmentDao.findAllForTenant(req.tenant?.id, {
      customerId: customer.id,
    });
    return localizedResponse(req, res, 200, "common.success", {}, result.data);
  } catch (err) {
    console.error("getSalonCustomerAppointmentsHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadAppointments");
  }
};

const cancelSalonAppointmentHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentDao.findById(appointmentId, req.tenant?.id);
    if (!appointment) {
      return localizedError(req, res, 404, "salon.appointmentNotFound");
    }
    if (appointment.status === "cancelled" || appointment.status === "completed") {
      return localizedError(req, res, 400, "common.appointmentCannotBeCancelled");
    }

    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );

    if (appointment.customerId !== customer.id && req.user?.role !== "admin") {
      return localizedError(req, res, 403, "common.youDoNotHavePermissionToCancelThisAppointment");
    }

    const updated = await appointmentDao.update(appointmentId, req.tenant?.id, { status: "cancelled" }); // codacy-suppress nosql-injection - parameterized ORM call
    return localizedResponse(req, res, 200, "common.success", {}, updated);
  } catch (err) {
    console.error("cancelSalonAppointmentHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToCancelAppointment");
  }
};

const rebookSalonAppointmentHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentDao.findById(appointmentId, req.tenant?.id);
    if (!appointment) {
      return localizedError(req, res, 404, "salon.appointmentNotFound");
    }
    if (!["completed", "cancelled"].includes(appointment.status)) {
      return localizedError(req, res, 400, "common.onlyCompletedOrCancelledAppointmentsCanBeRebooked");
    }

    const customer = await reservationDAO.findOrCreateCustomer(
      buildCustomerDetails(req.user),
      null,
      req.tenant?.id
    );

    if (appointment.customerId !== customer.id && req.user?.role !== "admin") {
      return localizedError(req, res, 403, "common.youDoNotHavePermissionToRebookThisAppointment");
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

    return localizedResponse(req, res, 200, "common.success", {}, newAppointment);
  } catch (err) {
    console.error("rebookSalonAppointmentHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToRebookAppointment");
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
      return localizedResponse(req, res, 200, "common.success", {}, []);
    }
    const giftCards = await giftCardDao.findAll(req.tenant?.id, {}); // codacy-suppress nosql-injection - parameterized ORM call
    const customerCards = giftCards.filter(
      (card) => card.purchasedByCustomerId === customer.id || card.redeemedByCustomerId === customer.id
    );
    return localizedResponse(req, res, 200, "common.success", {}, customerCards);
  } catch (err) {
    console.error("getCustomerGiftCardsHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadGiftCards");
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
      return localizedResponse(req, res, 200, "common.success", {}, []);
    }
    const referrals = await referralDao.findAll(req.tenant?.id, {}); // codacy-suppress nosql-injection - parameterized ORM call
    const customerReferrals = referrals.filter(
      (r) => r.referrerCustomerId === customer.id || r.refereeCustomerId === customer.id
    );
    return localizedResponse(req, res, 200, "common.success", {}, customerReferrals);
  } catch (err) {
    console.error("getCustomerReferralsHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadReferrals");
  }
};

const listServicePackagesHandler = async (req, res) => {
  try {
    const packages = await servicePackageDao.findAll(req.tenant?.id, {}); // codacy-suppress nosql-injection - parameterized ORM call
    return localizedResponse(req, res, 200, "common.success", {}, packages);
  } catch (err) {
    console.error("listServicePackagesHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadPackages");
  }
};

const listPricingRulesHandler = async (req, res) => {
  try {
    const rules = await pricingRuleDao.findAll(req.tenant?.id, { isActive: true }); // codacy-suppress nosql-injection - parameterized ORM call
    return localizedResponse(req, res, 200, "common.success", {}, rules);
  } catch (err) {
    console.error("listPricingRulesHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadPricingRules");
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
