const db = require("../../db/models");
const legalAcceptanceDAO = require("../DAOs/legalAcceptance.dao");
const dsarRequestDAO = require("../DAOs/dsarRequest.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const computeScorecard = async (tenantId) => {
  const totalTenants = await db.tenant.count({
    where: tenantId ? { id: tenantId } : undefined,
  });

  const accepted = await legalAcceptanceDAO.list({
    tenantId,
    limit: 10000,
  });

  const acceptanceRate = totalTenants > 0 ? (accepted.length / totalTenants) * 100 : 0;

  const byDocument = {};
  for (const acceptance of accepted) {
    const doc = acceptance.documentKey || "unknown";
    if (!byDocument[doc]) {
      byDocument[doc] = { accepted: 0, pending: 0, total: 0 };
    }
    byDocument[doc].accepted += 1;
    byDocument[doc].total += 1;
  }

  return {
    totalTenants,
    acceptedCount: accepted.length,
    pendingCount: 0,
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
    return res.status(400).json({ success: false, message: "requestId is required" });
  }

  const record = await dsarRequestDAO.findById(requestId);
  if (!record) {
    return res.status(404).json({ success: false, message: "DSAR request not found" });
  }

  if (record.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: `DSAR request is already ${record.status}`,
    });
  }

  await dsarRequestDAO.updateStatus(requestId, record.tenantId, "fulfilled", "Auto-fulfilled by compliance automation", new Date());

  await platformAuditDAO.log(
    req.user.id,
    "compliance.dsar.auto_fulfilled",
    "dsar_request",
    requestId,
    null,
    { requestType: record.requestType, autoFulfilled: true },
    req.ip
  );

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
