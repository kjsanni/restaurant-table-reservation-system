const db = require("../../db/models");

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

complianceEvidenceDAO.update = async (id, updates) => {
  const item = await complianceEvidenceDAO.findById(id);
  if (!item) return null;
  await item.update(updates);
  return item;
};

complianceEvidenceDAO.remove = async (id) => {
  const item = await complianceEvidenceDAO.findById(id);
  if (!item) return null;
  await item.destroy();
  return item;
};

module.exports = complianceEvidenceDAO;
