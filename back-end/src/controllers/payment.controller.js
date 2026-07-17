const paymentService = require("../services/paymentService");
const { buildSplitConfig } = require("../tenant-platform/services/paystack.service");

const getPaymentsHandler = async (req, res) => {
  const { reservationId } = req.params;
  const payments = await paymentService.getPaymentsForReservation(reservationId, req.tenant?.id);
  const totalPaid = await paymentService.getTotalPaid(reservationId, req.tenant?.id);
  return res.status(200).json({ success: true, payments, totalPaid });
};

const addPaymentHandler = async (req, res) => {
  const { reservationId } = req.params;
  const payment = await paymentService.addPayment(reservationId, req.body, req.tenant?.id);
  return res.status(201).json({
    success: true,
    message: "Payment added successfully!",
    payment: payment.payment,
    totalPaid: payment.totalPaid,
    reservation: payment.reservation,
  });
};

const initializePaymentHandler = async (req, res) => {
  const { reservationId } = req.params;
  const { email, amount, firstName, lastName, phone } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ success: false, message: "Email and amount are required" });
  }

  const db = require("../db/models");
  const tenant = await db.tenant.findByPk(req.tenant?.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const splitConfig = buildSplitConfig(tenant);
  const { initializeCharge } = require("../tenant-platform/services/paystack.service");

  try {
    const result = await initializeCharge({
      email,
      amount: parseFloat(amount),
      metadata: {
        tenantId: tenant.id,
        reservationId,
        tenantSlug: tenant.slug,
      },
      splitConfig,
    });

    return res.status(200).json({
      success: true,
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
};

const removePaymentHandler = async (req, res) => {
  const { reservationId, id } = req.params;
  const result = await paymentService.removePayment(reservationId, id, req.tenant?.id);
  return res.status(200).json({
    success: true,
    message: "Payment removed successfully!",
    totalPaid: result.totalPaid,
    reservation: result.reservation,
  });
};

const refundPaymentHandler = async (req, res) => {
  const { reservationId, id } = req.params;
  const userId = req.user?.id || null;
  const idempotencyKey = req.headers["idempotency-key"] || `${reservationId}-${id}-${Date.now()}`;

  const result = await paymentService.refundPayment(reservationId, id, {
    ...req.body,
    refundedBy: userId,
    idempotencyKey,
  }, req.tenant?.id);

  return res.status(200).json({
    success: true,
    message: result.skipped ? "Duplicate refund request ignored" : "Refund recorded",
    refund: result.refund,
    skipped: result.skipped,
  });
};

const getHistoryHandler = async (req, res) => {
  const filters = {
    reservationId: req.query.reservationId,
    method: req.query.method,
    from: req.query.from,
    to: req.query.to,
  };
  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }
  const result = await paymentService.getPaymentHistory(filters, req.tenant?.id, pagination);
  return res.status(200).json({ success: true, ...result });
};

const getRevenueStatsHandler = async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const stats = await paymentService.getRevenueStats(from, to, req.tenant?.id);
  return res.status(200).json({ success: true, stats });
};

module.exports = {
  getPaymentsHandler,
  addPaymentHandler,
  initializePaymentHandler,
  removePaymentHandler,
  refundPaymentHandler,
  getHistoryHandler,
  getRevenueStatsHandler,
};
