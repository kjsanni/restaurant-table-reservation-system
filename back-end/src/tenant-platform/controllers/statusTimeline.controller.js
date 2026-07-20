const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const getTimelineHandler = async (req, res) => {
  const tenantId = parseInt(req.params.id, 10);
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const logs = await db.platformAuditLog.findAll({
    where: { entityType: "tenant", entityId: tenantId },
    order: [["createdAt", "DESC"]],
  });

  const timeline = [];
  const createdAt = tenant.createdAt;
  if (createdAt) {
    timeline.push({ date: createdAt, action: "tenant_created", description: "Tenant created" });
  }
  if (tenant.status === "active" && tenant.subscriptionStatus === "active") {
    timeline.push({ date: tenant.lastPaymentAt || createdAt, action: "payment_succeeded", description: "Payment succeeded" });
  }
  if (tenant.status === "suspended") {
    timeline.push({ date: tenant.suspendedAt, action: "tenant_suspended", description: `Suspended: ${tenant.suspendedReason || ""}`.trim() });
  }
  if (tenant.status === "past_due") {
    timeline.push({ date: tenant.graceEndsAt, action: "payment_failed", description: "Payment failed — past due" });
  }
  if (tenant.status === "cancelled") {
    timeline.push({ date: tenant.updatedAt, action: "subscription_cancelled", description: "Subscription cancelled" });
  }
  if (tenant.convertedFromTrialAt) {
    timeline.push({ date: tenant.convertedFromTrialAt, action: "trial_converted", description: "Converted from trial to paid" });
  }
  if (tenant.trialExtendsTo) {
    timeline.push({ date: tenant.trialExtendsTo, action: "trial_extended", description: "Trial extended" });
  }

  for (const log of logs) {
    timeline.push({
      date: log.createdAt,
      action: log.action,
      description: `${log.action}${log.metadata?.reason ? `: ${log.metadata.reason}` : ""}`,
    });
  }

  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({ success: true, collection: timeline });
};

module.exports = { getTimelineHandler };
