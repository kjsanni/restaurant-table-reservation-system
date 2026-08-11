const db = require("../../db/models");

const legalAcceptanceDAO = {};

legalAcceptanceDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.accepted !== undefined) where.accepted = filters.accepted;
  if (filters.slug) where.slug = filters.slug;

  return db.legalAcceptance.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

// All acceptances for a tenant (immutable history, newest first).
legalAcceptanceDAO.listByTenant = (tenantId) => {
  return db.legalAcceptance.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

// The latest acceptance of a given slug for a tenant.
legalAcceptanceDAO.findLatest = (tenantId, slug) => {
// codacy-suppress NoSqlInjection
  return db.legalAcceptance.findOne({
    where: { tenantId, slug },
    order: [["createdAt", "DESC"]],
  });
};

// Append a new (immutable) acceptance record.
legalAcceptanceDAO.record = ({ tenantId, userId, slug, version, ipAddress, userAgent }) => {
  return db.legalAcceptance.create({
    tenantId,
    userId: userId || null,
    slug,
    version,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
};

module.exports = legalAcceptanceDAO;
