const response = require("../utils/response");

const db = require("../../db/models");
const authDAO = require("../../DAOs/auth.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const listSessionsHandler = async (req, res) => {
  const tokens = await db.refreshToken.findAll({
    where: {
      userId: req.user.id,
      isRevoked: false,
      expiresAt: { [db.Sequelize.Op.gt]: new Date() },
    },
    order: [["createdAt", "DESC"]],
  });

  const sessions = tokens.map((t) => {
    const data = t.toJSON();
    return {
      id: data.id,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      isRevoked: data.isRevoked,
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
    };
  });

  res.status(200).json({ success: true, collection: sessions });
};

const revokeSessionHandler = async (req, res) => {
  const token = await db.refreshToken.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!token) {
    return response.notFound(res, "Session not found");
  }

  await token.update({ isRevoked: true });

  await auditLog(req, "super_admin.session_revoked", "user", req.user.id, { sessionId: token.id });

  res.status(200).json({ success: true, message: "Session revoked" });
};

const revokeAllSessionsHandler = async (req, res) => {
  await authDAO.revokeAllUserTokens(req.user.id, req.tenant?.id);

  await auditLog(req, "super_admin.all_sessions_revoked", "user", req.user.id, {});

  res.status(200).json({ success: true, message: "All sessions revoked" });
};

module.exports = {
  listSessionsHandler,
  revokeSessionHandler,
  revokeAllSessionsHandler,
};
