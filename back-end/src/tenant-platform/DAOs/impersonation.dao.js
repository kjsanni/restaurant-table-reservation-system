const db = require("../../db/models");
const jwt = require("jsonwebtoken");
const _crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || require("crypto").randomBytes(64).toString("hex");

const createSession = async (payload) => {
  const token = jwt.sign(
    {
      userId: payload.tenantUserId,
      role: payload.tenantUserRole,
      tenantId: payload.tenantId,
      purpose: "impersonation",
      superAdminId: payload.superAdminId,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const session = await db.impersonationSession.create({
    superAdminId: payload.superAdminId,
    tenantUserId: payload.tenantUserId,
    tenantId: payload.tenantId,
    token,
    reason: payload.reason || null,
    ipAddress: payload.ipAddress || null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  return session;
};

const findValidSession = (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== "impersonation") return null;
    return decoded;
  } catch {
    return null;
  }
};

const endSession = async (id, superAdminId) => {
  const session = await db.impersonationSession.findOne({
    where: { id, superAdminId },
  });
  if (!session) return null;
  await session.update({ endedAt: new Date() });
  return session;
};

const listSessions = (superAdminId) => {
  return db.impersonationSession.findAll({
    where: { superAdminId },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
};

module.exports = {
  createSession,
  findValidSession,
  endSession,
  listSessions,
};
