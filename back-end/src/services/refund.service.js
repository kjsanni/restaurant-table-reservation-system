const refundDAO = require("../DAOs/refund.dao");
const paymentDAO = require("../DAOs/payment.dao");

const createRefund = async (paymentId, data) => {
  const existing = await refundDAO.findByIdempotencyKey(data.idempotencyKey);
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
  });

  return refund;
};

const getRefundsByPayment = async (paymentId) => {
  return await refundDAO.findByPaymentId(paymentId);
};

module.exports = {
  createRefund,
  getRefundsByPayment,
};
