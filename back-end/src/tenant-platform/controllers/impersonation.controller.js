const impersonationDAO = require("../DAOs/impersonation.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const startImpersonationHandler = async (req, res) => {
  const { tenantUserId, reason } = req.body;
  if (!tenantUserId) {
    return res.status(400).json({ success: false, message: "tenantUserId is required" });
  }

  const targetUser = await require("../../db/models").user.findByPk(tenantUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "Target user not found" });
  }

  if (targetUser.isSuperAdmin) {
    return res.status(400).json({ success: false, message: "Cannot impersonate another super admin" });
  }

  const session = await impersonationDAO.createSession({
    superAdminId: req.user.id,
    tenantUserId: targetUser.id,
    tenantId: targetUser.tenantId,
    tenantUserRole: targetUser.role,
    reason: reason || null,
    ipAddress: req.ip,
  });

  await platformAuditDAO.log(
    req.user.id,
    "impersonation.started",
    "user",
    targetUser.id,
    targetUser.tenantId,
    { reason, targetEmail: targetUser.email },
    req.ip
  );

  res.status(201).json({
    success: true,
    token: session.token,
    expiresAt: session.expiresAt,
  });
};

const endImpersonationHandler = async (req, res) => {
  const { id } = req.params;
  const session = await impersonationDAO.endSession(id, req.user.id);
  if (!session) {
    return res.status(404).json({ success: false, message: "Impersonation session not found" });
  }

  await platformAuditDAO.log(
    req.user.id,
    "impersonation.ended",
    "user",
    session.tenantUserId,
    session.tenantId,
    {},
    req.ip
  );

  res.status(200).json({ success: true });
};

const listImpersonationHandler = async (req, res) => {
  const sessions = await impersonationDAO.listSessions(req.user.id);
  res.status(200).json({ success: true, collection: sessions });
};

module.exports = {
  startImpersonationHandler,
  endImpersonationHandler,
  listImpersonationHandler,
};
