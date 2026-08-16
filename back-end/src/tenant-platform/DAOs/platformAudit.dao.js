const db = require("../../db/models");
const { fireWebhook } = require("../services/webhookNotification.service");

const platformAuditDAO = {};

const buildWhereClause = (filters, extra = {}) => {
  const where = { ...extra };
  if (filters.actorUserId) where.actorUserId = filters.actorUserId;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt[db.Sequelize.Op.gte] = filters.startDate;
    if (filters.endDate) where.createdAt[db.Sequelize.Op.lte] = filters.endDate;
  }
  return where;
};

const buildListOptions = (filters = {}, extra = {}) => ({
  where: buildWhereClause(filters, extra),
  order: [["createdAt", "DESC"]],
  limit: filters.limit || 100,
  offset: filters.offset || 0,
});

platformAuditDAO.log = (actorUserId, action, entityType, entityId, tenantId, metadata = {}, ipAddress = null) => {
  const payload = { actorUserId, action, entityType, entityId, tenantId, metadata, ipAddress };
  const record = db.platformAuditLog.create(payload); // codacy-suppress nosql-injection - parameterized ORM call

  fireWebhook("platform.audit.created", payload, tenantId).catch(() => {});

  return record;
};

platformAuditDAO.list = (filters = {}) => {
  return db.platformAuditLog.findAll(buildListOptions(filters)); // codacy-suppress nosql-injection - parameterized ORM call
};

platformAuditDAO.findRecent = (action, limit = 5) => {
  return db.platformAuditLog.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { action },
    order: [["createdAt", "DESC"]],
    limit,
  });
};

platformAuditDAO.findAllForUser = (actorUserId, filters = {}) => {
  return db.platformAuditLog.findAll(buildListOptions(filters, { actorUserId })); // codacy-suppress nosql-injection - parameterized ORM call
};

platformAuditDAO.findAllForTenant = (tenantId, filters = {}) => {
  return db.platformAuditLog.findAll(buildListOptions(filters, { tenantId })); // codacy-suppress nosql-injection - parameterized ORM call
};

platformAuditDAO.findSuspicious = (filters = {}) => {
  const suspiciousActions = [
    "platform_role.assign",
    "platform_role.revoke",
    "tenant.create",
    "tenant.update",
    "tenant.delete",
    "billing.update",
    "compliance.update",
    "break_glass.request",
    "break_glass.approve",
    "break_glass.revoke",
  ];

  return db.platformAuditLog.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: buildWhereClause(filters, { action: { [db.Sequelize.Op.in]: suspiciousActions } }),
    include: [
      {
        model: db.user,
        as: "actor",
        attributes: ["id", "username", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

module.exports = platformAuditDAO;
