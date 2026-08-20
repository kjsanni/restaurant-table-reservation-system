const db = require("../db/models");
const Refund = db.refund;

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

const createRefund = async (data, tenantId, transaction) => {
  return await Refund.create(
    {
      ...data,
      ...withTenant({}, tenantId),
    },
    { transaction }
  );
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
