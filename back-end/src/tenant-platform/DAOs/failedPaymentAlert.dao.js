const db = require("../../db/models");

const failedPaymentAlertDAO = {};

failedPaymentAlertDAO.create = async (payload) => {
  return await db.failedPaymentAlert.create(payload);
};

failedPaymentAlertDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.gateway) where.gateway = filters.gateway;

  return db.failedPaymentAlert.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

failedPaymentAlertDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.failedPaymentAlert.findOne({ where });
};

failedPaymentAlertDAO.update = async (id, updates, tenantId) => {
  const alert = await failedPaymentAlertDAO.findById(id, tenantId);
  if (!alert) return null;
  await alert.update(updates);
  return alert;
};

failedPaymentAlertDAO.incrementRetry = async (id, tenantId) => {
  const alert = await failedPaymentAlertDAO.findById(id, tenantId);
  if (!alert) return null;
  await alert.update({
    retryCount: alert.retryCount + 1,
    lastRetriedAt: new Date(),
    status: alert.retryCount + 1 >= alert.maxRetries ? "abandoned" : "retrying",
  });
  return alert;
};

failedPaymentAlertDAO.resolve = async (id, tenantId) => {
  const alert = await failedPaymentAlertDAO.findById(id, tenantId);
  if (!alert) return null;
  await alert.update({
    status: "resolved",
    resolvedAt: new Date(),
  });
  return alert;
};

module.exports = failedPaymentAlertDAO;
