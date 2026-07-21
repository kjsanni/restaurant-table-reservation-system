const db = require("../db/models");
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createDelivery = async (tenantId, data) => {
  return await db.delivery.create({
    ...withTenant({}, tenantId),
    ...data,
  });
};

const getDeliveryById = async (id, tenantId) => {
  return await db.delivery.findOne({
    where: withTenant({ id }, tenantId),
  });
};

const getDeliveryByPartnerRef = async (partnerRef, tenantId) => {
  return await db.delivery.findOne({
    where: withTenant({ partnerRef }, tenantId),
  });
};

const getDeliveryByTrackingNumber = async (trackingNumber, tenantId) => {
  return await db.delivery.findOne({
    where: withTenant({ trackingNumber }, tenantId),
  });
};

const getDeliveriesByOrderId = async (orderId, tenantId) => {
  return await db.delivery.findAll({
    where: withTenant({ orderId }, tenantId),
    order: [["createdAt", "DESC"]],
  });
};

const getAllDeliveries = async (tenantId, filters = {}, pagination = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.orderId) where.orderId = filters.orderId;
  if (filters.trackingNumber) where.trackingNumber = { [Op.like]: `%${filters.trackingNumber}%` };
  if (filters.customerPhone) where.customerPhone = { [Op.like]: `%${filters.customerPhone}%` };

  const opts = {
    where,
    order: [["createdAt", "DESC"]],
  };

  if (pagination.limit) opts.limit = pagination.limit;
  if (pagination.offset !== undefined) opts.offset = pagination.offset;

  const { rows, count } = await db.delivery.findAndCountAll(opts);
  return { deliveries: rows, total: count };
};

const updateDelivery = async (id, tenantId, updates) => {
  const delivery = await db.delivery.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!delivery) return null;
  return await delivery.update(updates);
};

const updateDeliveryByPartnerRef = async (partnerRef, tenantId, updates) => {
  const delivery = await db.delivery.findOne({
    where: withTenant({ partnerRef }, tenantId),
  });
  if (!delivery) return null;
  return await delivery.update(updates);
};

const deleteDelivery = async (id, tenantId) => {
  const delivery = await db.delivery.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!delivery) return null;
  await delivery.destroy();
  return true;
};

module.exports = {
  createDelivery,
  getDeliveryById,
  getDeliveryByPartnerRef,
  getDeliveryByTrackingNumber,
  getDeliveriesByOrderId,
  getAllDeliveries,
  updateDelivery,
  updateDeliveryByPartnerRef,
  deleteDelivery,
};
