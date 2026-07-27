const db = require("../../db/models");

const encryptionKeyDAO = {};

encryptionKeyDAO.create = async (payload) => {
  return await db.encryptionKey.create(payload);
};

encryptionKeyDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.purpose) where.purpose = filters.purpose;

  return db.encryptionKey.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

encryptionKeyDAO.findById = (id) => {
  return db.encryptionKey.findByPk(id);
};

encryptionKeyDAO.update = async (id, updates) => {
  const key = await encryptionKeyDAO.findById(id);
  if (!key) return null;
  await key.update(updates);
  return key;
};

encryptionKeyDAO.remove = async (id) => {
  const key = await encryptionKeyDAO.findById(id);
  if (!key) return null;
  await key.destroy();
  return key;
};

module.exports = encryptionKeyDAO;
