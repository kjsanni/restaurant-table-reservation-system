const db = require("../../db/models");
const authDAO = require("../../DAOs/auth.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

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
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  await token.update({ isRevoked: true });

  await platformAuditDAO.log(
    req.user.id,
    "super_admin.session_revoked",
    "user",
    req.user.id,
    req.tenant?.id || null,
    { sessionId: token.id },
    req.ip
  );

  res.status(200).json({ success: true, message: "Session revoked" });
};

const revokeAllSessionsHandler = async (req, res) => {
  await authDAO.revokeAllUserTokens(req.user.id, req.tenant?.id);

  await platformAuditDAO.log(
    req.user.id,
    "super_admin.all_sessions_revoked",
    "user",
    req.user.id,
    req.tenant?.id || null,
    {},
    req.ip
  );

  res.status(200).json({ success: true, message: "All sessions revoked" });
};

module.exports = {
  listSessionsHandler,
  revokeSessionHandler,
  revokeAllSessionsHandler,
};
