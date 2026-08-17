const db = require("../../db/models");
const baseDAO = require("./base.dao");

const insuranceDocumentDAO = {};

insuranceDocumentDAO.create = async (payload) => {
  return await db.insuranceDocument.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

insuranceDocumentDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return db.insuranceDocument.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["expiryDate", "ASC"]],
    limit: filters.limit || 100,
  });
};

insuranceDocumentDAO.findById = (id) => {
  return db.insuranceDocument.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

insuranceDocumentDAO.update = async (id, updates) => baseDAO.updateById(db.insuranceDocument, id, updates);

insuranceDocumentDAO.remove = async (id) => baseDAO.removeById(db.insuranceDocument, id);

module.exports = insuranceDocumentDAO;
