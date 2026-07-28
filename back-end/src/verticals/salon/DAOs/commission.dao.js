"use strict";
const db = require("../../../db/models");

const createCommission = async (data) => {
  const commission = await db.commission.create(data);
  return commission;
};

const findById = async (id, tenantId) => {
  const commission = await db.commission.findOne({
    where: { id, tenantId },
  });
  return commission;
};

const findAllForTenant = async (tenantId, filters = {}) => {
  const where = { tenantId };
  if (filters.userId) where.userId = filters.userId;
  if (filters.status) where.status = filters.status;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.appointmentId) where.appointmentId = filters.appointmentId;

  const { rows: data, count: total } = await db.commission.findAndCountAll({
    where,
    include: [
      {
        model: db.user,
        as: "stylist",
        attributes: ["id", "username", "email"],
      },
      {
        model: db.service,
        as: "service",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: filters.limit ? Number(filters.limit) : 50,
    offset: filters.offset ? Number(filters.offset) : 0,
  });

  return { data, total };
};

const updateCommission = async (id, tenantId, updates) => {
  const commission = await db.commission.findOne({
    where: { id, tenantId },
  });
  if (!commission) return null;
  await commission.update(updates);
  return commission;
};

const deleteCommission = async (id, tenantId) => {
  const commission = await db.commission.findOne({
    where: { id, tenantId },
  });
  if (!commission) return false;
  await commission.destroy();
  return true;
};

const markAsPaid = async (id, tenantId) => {
  const commission = await db.commission.findOne({
    where: { id, tenantId, status: "pending" },
  });
  if (!commission) return null;
  await commission.update({
    status: "paid",
    paidAt: new Date(),
  });
  return commission;
};

const getPendingTotal = async (tenantId, userId = null) => {
  const where = { tenantId, status: "pending" };
  if (userId) where.userId = userId;

  const result = await db.commission.findOne({
    where,
    attributes: [
      [db.sequelize.fn("SUM", db.sequelize.col("amount")), "total"],
    ],
    raw: true,
  });

  return parseFloat(result?.total || 0);
};

module.exports = {
  createCommission,
  findById,
  findAllForTenant,
  updateCommission,
  deleteCommission,
  markAsPaid,
  getPendingTotal,
};
