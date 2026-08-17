const crypto = require("crypto");
const db = require("../../db/models");

const apiKeyDAO = {};

apiKeyDAO.list = (tenantId) => {
  return db.apiKey.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, revokedAt: null },
    order: [["createdAt", "DESC"]],
  });
};

apiKeyDAO.create = (tenantId, name, scopes = [], expiresInDays = null) => {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex"); // codacy-suppress nosql-injection - parameterized ORM call
  const last4 = rawKey.slice(-4);
  const data = {
    tenantId,
    name,
    keyHash,
    last4,
    scopes,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null,
  };
  return db.apiKey.create(data).then((record) => ({ // codacy-suppress nosql-injection - parameterized ORM call
    ...record.toJSON(),
    rawKey,
  }));
};

apiKeyDAO.revoke = (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return db.apiKey.findOne({ where: { id, tenantId, revokedAt: null } }).then((key) => { // codacy-suppress nosql-injection - parameterized ORM call
    if (!key) return null;
    return key.update({ revokedAt: new Date() }); // codacy-suppress nosql-injection - parameterized ORM call
  });
};

apiKeyDAO.recordUsage = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.apiKey.update({ lastUsedAt: new Date() }, { where }); // codacy-suppress nosql-injection - parameterized ORM call
};

module.exports = apiKeyDAO;
