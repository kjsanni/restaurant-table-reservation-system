const db = require("../../db/models");
const baseDAO = require("./base.dao");

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

insuranceDocumentDAO.update = async (id, updates) => baseDAO.updateById(db.insuranceDocument, id, updates);

insuranceDocumentDAO.remove = async (id) => baseDAO.removeById(db.insuranceDocument, id);

module.exports = insuranceDocumentDAO;
