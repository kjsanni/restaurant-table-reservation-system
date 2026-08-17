const db = require("../db/models");
const Refund = db.refund;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createRefund = async (data, tenantId) => {
  return await Refund.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...data,
    ...withTenant({}, tenantId),
  });
};

const findById = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return await Refund.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
};

const findByPaymentId = async (paymentId, tenantId) => {
  return await Refund.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ paymentId }, tenantId),
    order: [["createdAt", "DESC"]],
  });
};

const findByIdempotencyKey = async (key, tenantId) => {
  return await Refund.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ idempotencyKey: key }, tenantId),
  });
};

const updateStatus = async (id, status, tenantId) => {
  const refund = await Refund.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!refund) return null;
  return await refund.update({ status }); // codacy-suppress nosql-injection - parameterized ORM call
};

module.exports = {
  createRefund,
  findById,
  findByPaymentId,
  findByIdempotencyKey,
  updateStatus,
};
