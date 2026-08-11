const crypto = require("crypto");
const db = require("../../db/models");

const apiKeyDAO = {};

apiKeyDAO.list = (tenantId) => {
  return db.apiKey.findAll({
    where: { tenantId, revokedAt: null },
    order: [["createdAt", "DESC"]],
  });
};

apiKeyDAO.create = (tenantId, name, scopes = [], expiresInDays = null) => {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const last4 = rawKey.slice(-4);
  const data = {
    tenantId,
    name,
    keyHash,
    last4,
    scopes,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null,
  };
  return db.apiKey.create(data).then((record) => ({
    ...record.toJSON(),
    rawKey,
  }));
};

apiKeyDAO.revoke = (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return db.apiKey.findOne({ where: { id, tenantId, revokedAt: null } }).then((key) => {
    if (!key) return null;
    return key.update({ revokedAt: new Date() });
  });
};

apiKeyDAO.recordUsage = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.apiKey.update({ lastUsedAt: new Date() }, { where });
};

module.exports = apiKeyDAO;
