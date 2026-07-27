const db = require("../../db/models");
const authDAO = require("../../DAOs/auth.dao");
const legalAcceptanceDAO = require("../DAOs/legalAcceptance.dao");

const getComplianceScorecardHandler = async (req, res) => {
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;

  const totalTenants = await db.tenant.count({
    where: tenantId ? { id: tenantId } : undefined,
  });

  const accepted = await legalAcceptanceDAO.list({
    tenantId,
    accepted: true,
    limit: 10000,
  });

  const pending = await legalAcceptanceDAO.list({
    tenantId,
    accepted: false,
    limit: 10000,
  });

  const acceptanceRate = totalTenants > 0 ? (accepted.length / totalTenants) * 100 : 0;

  const byDocument = {};
  for (const acceptance of [...accepted, ...pending]) {
    const doc = acceptance.documentKey || "unknown";
    if (!byDocument[doc]) {
      byDocument[doc] = { accepted: 0, pending: 0, total: 0 };
    }
    if (acceptance.accepted) {
      byDocument[doc].accepted += 1;
    } else {
      byDocument[doc].pending += 1;
    }
    byDocument[doc].total += 1;
  }

  const scorecard = {
    totalTenants,
    acceptedCount: accepted.length,
    pendingCount: pending.length,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
    byDocument,
  };

  res.status(200).json({ success: true, scorecard });
};

module.exports = {
  getComplianceScorecardHandler,
};
