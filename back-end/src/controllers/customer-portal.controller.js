const reservationDAO = require("../DAOs/reservation.dao");
const paymentDAO = require("../DAOs/payment.dao");
const refundDAO = require("../DAOs/refund.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

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
    const customer = await resolveCustomer(req);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customer profile linked to this account",
      });
    }
    const allowedFields = ["firstName", "lastName", "phone", "address", "city", "preferences"];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }
    const updated = await reservationDAO.updateCustomer(customer.id, updates, req.tenant?.id);
    return res.status(200).json({ success: true, customer: updated });
  } catch (err) {
    console.error("updateCustomerProfileHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const getCustomerReservationsHandler = async (req, res) => {
  try {
    const customer = await resolveCustomer(req);
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

    const customer = await resolveCustomer(req);
    if (!customer || reservation.customerId !== customer.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this reservation" });
    }

    let refundDue = false;
    let refundAmount = 0;

    if (["paid", "partial"].includes(reservation.paymentStatus) && reservation.resDate && reservation.resTime) {
      const reservationDateTime = new Date(`${reservation.resDate}T${reservation.resTime}`);
      const now = new Date();
      const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilReservation >= CANCELLATION_POLICY_HOURS) {
        refundDue = true;
        const payments = await paymentDAO.findByReservation(reservationId, req.tenant?.id);
        refundAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      }
    }

    const updated = await reservationDAO.updateReservation(reservationId, { resStatus: "cancelled" }, req.tenant?.id);

    await reservationDAO.recordStatusChange(reservationId, reservation.resStatus, "cancelled", req.user?.id, {
      refundDue,
      refundAmount,
    }, req.tenant?.id);

    await platformAuditDAO.log(
      req.user?.id,
      "reservation.cancelled",
      "reservation",
      reservationId,
      req.tenant?.id,
      { refundDue, refundAmount, paymentStatus: reservation.paymentStatus },
      req.ip
    );

    if (refundDue && refundAmount > 0) {
      const payments = await paymentDAO.findByReservation(reservationId, req.tenant?.id);
      const payment = payments[0];
      if (payment) {
        await refundDAO.createRefund({
          reservationId,
          paymentId: payment.id,
          amount: refundAmount,
          reason: "Customer cancellation within policy window",
          status: "pending",
        }, req.tenant?.id);
      }
    }

    return res.status(200).json({ success: true, reservation: updated });
  } catch (err) {
    console.error("cancelReservationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to cancel reservation" });
  }
};

module.exports = {
  buildCustomerDetails,
  getCustomerProfileHandler,
  updateCustomerProfileHandler,
  getCustomerReservationsHandler,
  cancelReservationHandler,
};
