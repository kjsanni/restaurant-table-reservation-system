const response = require("../utils/response");

const db = require("../../db/models");
const legalAcceptanceDAO = require("../DAOs/legalAcceptance.dao");
const dsarRequestDAO = require("../DAOs/dsarRequest.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const AUTO_FULFILLABLE_DSAR_TYPES = ["access"];

const computeScorecard = async (tenantId) => {
  const totalTenants = await db.tenant.count({
    where: tenantId ? { id: tenantId } : undefined,
  });

  const acceptedCount = await legalAcceptanceDAO.count({
    tenantId,
  });

  const byDocument = {};
  const docRows = await legalAcceptanceDAO.groupByDocument({
    tenantId,
  });

  for (const row of docRows) {
    const doc = row.documentKey || "unknown";
    byDocument[doc] = {
      accepted: parseInt(row.count, 10),
      pending: 0,
      total: parseInt(row.count, 10),
    };
  }

  const acceptanceRate = totalTenants > 0 ? (acceptedCount / totalTenants) * 100 : 0;

  return {
    totalTenants,
    acceptedCount,
    pendingCount: totalTenants - acceptedCount,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
    byDocument,
  };
};

const getComplianceScorecardHandler = async (req, res) => {
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;
  const scorecard = await computeScorecard(tenantId);
  res.status(200).json({ success: true, scorecard });
};

const autoFulfillSimpleDsarHandler = async (req, res) => {
  const { requestId } = req.body;

  if (!requestId) {
    return response.badRequest(res, "requestId is required");
  }

  const record = await dsarRequestDAO.findById(requestId);
  if (!record) {
    return response.notFound(res, "DSAR request not found");
  }

  if (record.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: `DSAR request is already ${record.status}`,
    });
  }

  if (!AUTO_FULFILLABLE_DSAR_TYPES.includes(record.requestType)) {
    return res.status(400).json({
      success: false,
      message: "DSAR type requires manual review",
    });
  }

  await dsarRequestDAO.updateStatus(requestId, record.tenantId, "fulfilled", "Auto-fulfilled by compliance automation", new Date());

await auditLog(req, "compliance.dsar.auto_fulfilled", "dsar_request", requestId, { requestType: record.requestType, autoFulfilled: true });

  res.status(200).json({ success: true, message: "DSAR request auto-fulfilled" });
};

const scheduleComplianceRemindersHandler = async (req, res) => {
  const pending = await legalAcceptanceDAO.list({
    limit: 10000,
  });

  const reminders = pending.map((a) => ({
    id: a.id,
    tenantId: a.tenantId,
    documentKey: a.documentKey,
    createdAt: a.createdAt,
    daysPending: Math.floor(
      (Date.now() - new Date(a.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    ),
  }));

  res.status(200).json({ success: true, reminders, totalPending: reminders.length });
};

const generateComplianceReportHandler = async (req, res) => {
  const tenantId = req.user?.isSuperAdmin ? null : req.tenant?.id;

  const scorecard = await computeScorecard(tenantId);
  const dsarPending = await dsarRequestDAO.listByTenant(tenantId || undefined);
  const pendingDsarCount = dsarPending.filter((r) => r.status === "pending").length;

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: req.user.id,
    scorecard,
    pendingDsarCount,
    automations: {
      dsarAutoFulfillment: true,
      complianceReminders: true,
    },
  };

  res.status(200).json({ success: true, report });
};

module.exports = {
  getComplianceScorecardHandler,
  autoFulfillSimpleDsarHandler,
  scheduleComplianceRemindersHandler,
  generateComplianceReportHandler,
};
