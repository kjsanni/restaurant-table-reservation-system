"use strict";

const db = require("../../db/models");

const passSigningRequestDAO = {};

passSigningRequestDAO.create = async ({
  tenantId,
  eventId,
  requesterId,
  designSnapshot,
  amount,
  currency = "GHS",
}) => {
  return await db.passSigningRequest.create({ // codacy-suppress nosql-injection - parameterized ORM call
    tenantId,
    eventId,
    requesterId,
    designSnapshot,
    amount,
    currency,
    status: "pending_payment",
    platformStatuses: { apple: "pending", google: "pending", samsung: "pending" },
  });
};

passSigningRequestDAO.findById = (id, tenantId = null) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;

  return db.passSigningRequest.findOne({ // nosemgrep: javascript.lang.security.audit.no-sql-injection - Sequelize parameterized where, not MongoDB // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [
      { model: db.user, as: "requester", attributes: ["id", "username", "email"] },
      { model: db.user, as: "reviewer", attributes: ["id", "username", "email"] },
    ],
  });
};

passSigningRequestDAO.listByTenant = (tenantId, filters = {}) => {
  const where = { tenantId };
  if (filters.status) where.status = filters.status;

  return db.passSigningRequest.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 50,
  });
};

passSigningRequestDAO.listPendingApproval = (filters = {}) => {
  const where = { status: "pending" };
  if (filters.tenantId) where.tenantId = filters.tenantId;

  return db.passSigningRequest.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [{ model: db.user, as: "requester", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "ASC"]],
    limit: filters.limit || 100,
  });
};

passSigningRequestDAO.updatePaymentStatus = async (id, paymentReference) => {
  const request = await db.passSigningRequest.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!request) return null;

  if (request.status !== "pending_payment") return request;

  await request.update({ // codacy-suppress nosql-injection - parameterized ORM call
    paymentReference,
    status: "pending",
  });
  return request;
};

passSigningRequestDAO.approve = async (id, reviewerId, notes = null) => {
  const request = await passSigningRequestDAO.findById(id);
  if (!request) return null;
  if (request.status !== "pending") return null;

  await request.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "approved",
    reviewerId,
    reviewNotes: notes,
  });
  return request;
};

passSigningRequestDAO.reject = async (id, reviewerId, notes) => {
  const request = await passSigningRequestDAO.findById(id);
  if (!request) return null;
  if (request.status !== "pending") return null;

  await request.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "rejected",
    reviewerId,
    reviewNotes: notes,
  });
  return request;
};

passSigningRequestDAO.updatePlatformStatus = async (id, platform, status) => {
  const request = await db.passSigningRequest.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!request) return null;

  const current = request.platformStatuses || {};
  current[platform] = status;
  await request.update({ platformStatuses: current }); // codacy-suppress nosql-injection - parameterized ORM call
  return request;
};

passSigningRequestDAO.setSigning = async (id) => {
  const request = await db.passSigningRequest.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!request) return null;
  await request.update({ status: "signing" }); // codacy-suppress nosql-injection - parameterized ORM call
  return request;
};

passSigningRequestDAO.markCompletedIfAllDone = async (id) => {
  const request = await db.passSigningRequest.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!request) return null;

  const statuses = request.platformStatuses || {};
  const allSigned = Object.values(statuses).every((s) => s === "signed");
  const anyFailed = Object.values(statuses).some((s) => s === "failed");

  if (allSigned) {
    await request.update({ status: "completed", completedAt: new Date() }); // codacy-suppress nosql-injection - parameterized ORM call
  } else if (anyFailed && Object.values(statuses).every((s) => s === "signed" || s === "failed")) {
    await request.update({ status: "failed", completedAt: new Date() }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return request;
};

module.exports = passSigningRequestDAO;
