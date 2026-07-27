const db = require("../../db/models");

const insuranceDocumentDAO = {};

insuranceDocumentDAO.create = async (payload) => {
  return await db.insuranceDocument.create(payload);
};

insuranceDocumentDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return db.insuranceDocument.findAll({
    where,
    order: [["expiryDate", "ASC"]],
    limit: filters.limit || 100,
  });
};

insuranceDocumentDAO.findById = (id) => {
  return db.insuranceDocument.findByPk(id);
};

insuranceDocumentDAO.update = async (id, updates) => {
  const document = await insuranceDocumentDAO.findById(id);
  if (!document) return null;
  await document.update(updates);
  return document;
};

insuranceDocumentDAO.remove = async (id) => {
  const document = await insuranceDocumentDAO.findById(id);
  if (!document) return null;
  await document.destroy();
  return document;
};

module.exports = insuranceDocumentDAO;
