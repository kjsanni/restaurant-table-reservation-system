const db = require("../../db/models");
const baseDAO = require("./base.dao");

const tenantEncryptionKeyDAO = {};

tenantEncryptionKeyDAO.create = async (payload) => {
  return await db.tenantEncryptionKey.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

tenantEncryptionKeyDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.purpose) where.purpose = filters.purpose;

  return db.tenantEncryptionKey.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

tenantEncryptionKeyDAO.findById = (id) => {
  return db.tenantEncryptionKey.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

tenantEncryptionKeyDAO.findByTenantId = (tenantId, filters = {}) => {
  const where = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.purpose) where.purpose = filters.purpose;
  return db.tenantEncryptionKey.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

tenantEncryptionKeyDAO.update = async (id, updates) => baseDAO.updateById(db.tenantEncryptionKey, id, updates);

tenantEncryptionKeyDAO.remove = async (id) => baseDAO.removeById(db.tenantEncryptionKey, id);

module.exports = tenantEncryptionKeyDAO;
