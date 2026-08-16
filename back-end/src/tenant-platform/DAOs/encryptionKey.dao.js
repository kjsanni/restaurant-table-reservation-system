const db = require("../../db/models");
const baseDAO = require("./base.dao");

const encryptionKeyDAO = {};

encryptionKeyDAO.create = async (payload) => {
  return await db.encryptionKey.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

encryptionKeyDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.purpose) where.purpose = filters.purpose;

  return db.encryptionKey.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

encryptionKeyDAO.findById = (id) => {
  return db.encryptionKey.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

encryptionKeyDAO.update = async (id, updates) => baseDAO.updateById(db.encryptionKey, id, updates);

encryptionKeyDAO.remove = async (id) => baseDAO.removeById(db.encryptionKey, id);

module.exports = encryptionKeyDAO;
