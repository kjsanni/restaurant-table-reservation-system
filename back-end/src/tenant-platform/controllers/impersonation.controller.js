const response = require("../utils/response");

const impersonationDAO = require("../DAOs/impersonation.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const startImpersonationHandler = async (req, res) => {
  const { tenantUserId, reason } = req.body;
  if (!tenantUserId) {
    return response.badRequest(res, "tenantUserId is required");
  }

  const targetUser = await require("../../db/models").user.findByPk(tenantUserId);
  if (!targetUser) {
    return response.notFound(res, "Target user not found");
  }

  if (targetUser.isSuperAdmin) {
    return response.badRequest(res, "Cannot impersonate another super admin");
  }

  const session = await impersonationDAO.createSession({
    superAdminId: req.user.id,
    tenantUserId: targetUser.id,
    tenantId: targetUser.tenantId,
    tenantUserRole: targetUser.role,
    reason: reason || null,
    ipAddress: req.ip,
  });

await auditLog(req, "impersonation.started", "user", targetUser.id, { reason, targetEmail: targetUser.email }, { tenantId: targetUser.tenantId });

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
    return response.notFound(res, "Impersonation session not found");
  }

  await auditLog(req, "impersonation.ended", "user", session.tenantUserId, {}, { tenantId: session.tenantId });

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
