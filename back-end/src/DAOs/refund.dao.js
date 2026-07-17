const db = require("../db/models");
const Refund = db.refund;
const Payment = db.payment;
const { Op } = db.Sequelize;

const createRefund = async (data) => {
  return await Refund.create(data);
};

const findById = async (id) => {
  return await Refund.findByPk(id);
};

const findByPaymentId = async (paymentId) => {
  return await Refund.findAll({
    where: { paymentId },
    order: [["createdAt", "DESC"]],
  });
};

const findByIdempotencyKey = async (key) => {
  return await Refund.findOne({ where: { idempotencyKey: key } });
};

const updateStatus = async (id, status) => {
  const refund = await Refund.findByPk(id);
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
