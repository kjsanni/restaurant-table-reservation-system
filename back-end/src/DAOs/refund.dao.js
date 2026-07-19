const db = require("../db/models");
const Refund = db.refund;
const Payment = db.payment;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createRefund = async (data, tenantId) => {
  return await Refund.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const findById = async (id, tenantId) => {
  return await Refund.findOne({
    where: withTenant({ id }, tenantId),
  });
};

const findByPaymentId = async (paymentId, tenantId) => {
  return await Refund.findAll({
    where: withTenant({ paymentId }, tenantId),
    order: [["createdAt", "DESC"]],
  });
};

const findByIdempotencyKey = async (key, tenantId) => {
  return await Refund.findOne({
    where: withTenant({ idempotencyKey: key }, tenantId),
  });
};

const updateStatus = async (id, status, tenantId) => {
  const refund = await Refund.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!refund) return null;
  return await refund.update({ status });
};

module.exports = {
  createRefund,
  findById,
  findByPaymentId,
  findByIdempotencyKey,
  updateStatus,
};
