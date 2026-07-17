const refundDAO = require("../DAOs/refund.dao");
const paymentDAO = require("../DAOs/payment.dao");

const createRefund = async (paymentId, data, tenantId) => {
  const existing = await refundDAO.findByIdempotencyKey(data.idempotencyKey, tenantId);
  if (existing) {
    return existing;
  }

  const refund = await refundDAO.createRefund({
    paymentId,
    amount: data.amount,
    reason: data.reason || null,
    status: data.status || "pending",
    refundedBy: data.refundedBy || null,
    idempotencyKey: data.idempotencyKey || null,
  }, tenantId);

  return refund;
};

const getRefundsByPayment = async (paymentId, tenantId) => {
  return await refundDAO.findByPaymentId(paymentId, tenantId);
};

module.exports = {
  createRefund,
  getRefundsByPayment,
};
