const db = require("../../db/models");
const baseDAO = require("./base.dao");

const complianceEvidenceDAO = {};

complianceEvidenceDAO.create = async (payload) => {
  return await db.complianceEvidence.create(payload);
};

complianceEvidenceDAO.list = (filters = {}) => {
  const where = {};
  if (filters.framework) where.framework = filters.framework;
  if (filters.status) where.status = filters.status;
  if (filters.controlId) where.controlId = filters.controlId;

  return db.complianceEvidence.findAll({
    where,
    order: [["framework", "ASC"], ["controlId", "ASC"]],
    limit: filters.limit || 500,
  });
};

complianceEvidenceDAO.findById = (id) => {
  return db.complianceEvidence.findByPk(id);
};

complianceEvidenceDAO.update = async (id, updates) => baseDAO.updateById(db.complianceEvidence, id, updates);

complianceEvidenceDAO.remove = async (id) => baseDAO.removeById(db.complianceEvidence, id);

module.exports = complianceEvidenceDAO;
