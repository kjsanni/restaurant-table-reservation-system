const db = require("../../db/models");

const legalAcceptanceDAO = {};

// All acceptances for a tenant (immutable history, newest first).
legalAcceptanceDAO.listByTenant = (tenantId) => {
  return db.legalAcceptance.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]],
  });
};

// The latest acceptance of a given slug for a tenant.
legalAcceptanceDAO.findLatest = (tenantId, slug) => {
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
