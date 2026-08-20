const db = require("../../db/models");

const legalAcceptanceDAO = {};

legalAcceptanceDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.customerId !== undefined && filters.customerId !== null) where.customerId = filters.customerId;
  if (filters.accepted !== undefined) where.accepted = filters.accepted;
  if (filters.slug) where.slug = filters.slug;

  return db.legalAcceptance.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

legalAcceptanceDAO.count = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.customerId !== undefined && filters.customerId !== null) where.customerId = filters.customerId;
  if (filters.accepted !== undefined) where.accepted = filters.accepted;
  if (filters.slug) where.slug = filters.slug;

  return db.legalAcceptance.count({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
  });
};

legalAcceptanceDAO.groupByDocument = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.customerId !== undefined && filters.customerId !== null) where.customerId = filters.customerId;
  if (filters.accepted !== undefined) where.accepted = filters.accepted;
  if (filters.slug) where.slug = filters.slug;

  return db.legalAcceptance.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    attributes: [
      "documentKey",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
    ],
    group: ["documentKey"],
    raw: true,
  });
};

// All acceptances for a tenant (immutable history, newest first).
legalAcceptanceDAO.listByTenant = (tenantId) => {
  return db.legalAcceptance.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

// The latest acceptance of a given slug for a tenant.
legalAcceptanceDAO.findLatest = (tenantId, slug) => {
// codacy-suppress NoSqlInjection
  return db.legalAcceptance.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, slug },
    order: [["createdAt", "DESC"]],
  });
};

// Append a new (immutable) acceptance record.
legalAcceptanceDAO.record = ({ tenantId, userId, customerId, slug, version, ipAddress, userAgent }) => {
  return db.legalAcceptance.create({ // codacy-suppress nosql-injection - parameterized ORM call
    tenantId,
    userId: userId || null,
    customerId: customerId || null,
    slug,
    version,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
};

module.exports = legalAcceptanceDAO;
