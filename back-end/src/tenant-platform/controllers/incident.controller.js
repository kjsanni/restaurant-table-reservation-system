const db = require("../../db/models");
const authDAO = require("../../DAOs/auth.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const lockTenantHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  await tenant.update({
    status: "suspended",
    suspendedAt: new Date(),
    suspendedReason: req.body.reason || "Security incident",
  });

  await platformAuditDAO.log(
    req.user.id,
    "incident.tenant_locked",
    "tenant",
    tenant.id,
    tenant.id,
    { reason: req.body.reason || "Security incident" },
    req.ip
  );

  res.status(200).json({ success: true, item: tenant });
};

const resetTenantTokensHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const users = await db.user.findAll({
    where: { tenantId: tenant.id },
    attributes: ["id"],
  });

  for (const user of users) {
    await authDAO.revokeAllUserTokens(user.id, tenant.id);
  }

  await platformAuditDAO.log(
    req.user.id,
    "incident.tokens_reset",
    "tenant",
    tenant.id,
    tenant.id,
    { affectedUsers: users.length },
    req.ip
  );

  res.status(200).json({ success: true, affectedUsers: users.length });
};

const forceLogoutTenantHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const users = await db.user.findAll({
    where: { tenantId: tenant.id },
    attributes: ["id"],
  });

  for (const user of users) {
    await authDAO.revokeAllUserTokens(user.id, tenant.id);
  }

  await platformAuditDAO.log(
    req.user.id,
    "incident.force_logout",
    "tenant",
    tenant.id,
    tenant.id,
    { affectedUsers: users.length },
    req.ip
  );

  res.status(200).json({ success: true, affectedUsers: users.length });
};

module.exports = {
  lockTenantHandler,
  resetTenantTokensHandler,
  forceLogoutTenantHandler,
};
