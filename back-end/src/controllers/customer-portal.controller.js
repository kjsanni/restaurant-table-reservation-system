const reservationDAO = require("../DAOs/reservation.dao");
const paymentDAO = require("../DAOs/payment.dao");
const refundDAO = require("../DAOs/refund.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const db = require("../db/models");
const { localizedResponse, localizedError } = require("../utils/localizedResponse");

const CANCELLATION_POLICY_HOURS = 24;

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

const resolveCustomer = async (req) => {
  return await reservationDAO.findOrCreateCustomer(
    buildCustomerDetails(req.user),
    null,
    req.tenant?.id
  );
};

const getCustomerProfileHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return localizedError(req, res, 404, "common.profileLinkedToAccount");
    }
    return localizedResponse(req, res, 200, "common.success", {}, customer);
  } catch (err) {
    console.error("getCustomerProfileHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadProfile");
  }
};

const updateCustomerProfileHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return localizedError(req, res, 404, "common.profileLinkedToAccount");
    }
    const allowedFields = ["firstName", "lastName", "phone", "address", "city", "preferences"];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }
    const updated = await reservationDAO.updateCustomer(customer.id, updates, req.tenant?.id);
    return localizedResponse(req, res, 200, "common.success", {}, updated);
  } catch (err) {
    console.error("updateCustomerProfileHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToUpdateProfile");
  }
};

const getCustomerReservationsHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
    if (!customer) {
      return localizedResponse(req, res, 200, "common.success", {}, []);
    }
    const reservations = await reservationDAO.findAllReservationsRaw(
      { customerId: customer.id },
      req.tenant?.id
    );
    return localizedResponse(req, res, 200, "common.success", {}, reservations);
  } catch (err) {
    console.error("getCustomerReservationsHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToLoadReservations");
  }
};

const cancelReservationHandler = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await reservationDAO.findReservationById(reservationId, req.tenant?.id);
    if (!reservation) {
      return localizedError(req, res, 404, "common.reservationNotFound");
    }
    if (reservation.resStatus === "cancelled" || reservation.resStatus === "completed") {
      return localizedError(req, res, 400, "common.reservationCannotBeCancelled");
    }

    const customer = await resolveCustomer(req);
    if (!customer || reservation.customerId !== customer.id) {
      return localizedError(req, res, 403, "common.notAuthorizedForThisReservation");
    }

    let refundDue = false;

    if (["paid", "partial"].includes(reservation.paymentStatus) && reservation.resDate && reservation.resTime) {
      const reservationDateTime = new Date(`${reservation.resDate}T${reservation.resTime}`);
      const now = new Date();
      const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilReservation >= CANCELLATION_POLICY_HOURS) {
        refundDue = true;
      }
    }

    const result = await db.sequelize.transaction(async (t) => {
      const updated = await reservationDAO.updateReservation(reservationId, { resStatus: "cancelled" }, req.tenant?.id, t);

      let actualRefundAmount = 0;
      if (refundDue) {
        const payments = await paymentDAO.findByReservation(reservationId, req.tenant?.id);
        actualRefundAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        for (const payment of payments) {
          await refundDAO.createRefund({
            reservationId,
            paymentId: payment.id,
            amount: parseFloat(payment.amount || 0),
            reason: "Customer cancellation within policy window",
            status: "pending",
          }, req.tenant?.id, t);
        }
      }

      await reservationDAO.recordStatusChange(reservationId, reservation.resStatus, "cancelled", req.user?.id, {
        refundDue,
        refundAmount: actualRefundAmount,
      }, req.tenant?.id, t);

      await platformAuditDAO.log(
        req.user?.id,
        "reservation.cancelled",
        "reservation",
        reservationId,
        req.tenant?.id,
        { refundDue, refundAmount: actualRefundAmount, paymentStatus: reservation.paymentStatus },
        req.ip,
        t
      );

      return { success: true, reservation: updated };
    });

    return localizedResponse(req, res, 200, "common.success", {}, result);
  } catch (err) {
    console.error("cancelReservationHandler error:", err.message);
    return localizedError(req, res, 500, "common.failedToCancelAppointment");
  }
};

module.exports = {
  buildCustomerDetails,
  getCustomerProfileHandler,
  updateCustomerProfileHandler,
  getCustomerReservationsHandler,
  cancelReservationHandler,
};
