const db = require("../../db/models");

const caseStudyDAO = {};

caseStudyDAO.listCaseStudies = async (filters = {}) => {
  const where = {};
  if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
  if (filters.tenantId) where.tenantId = filters.tenantId;

  const studies = await db.caseStudy.findAll({
    where,
    include: filters.includeTenant ? [{ model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] }] : [],
    order: [["createdAt", "DESC"]],
  });

  return studies.map((s) => s.toJSON());
};

caseStudyDAO.createCaseStudy = async (payload) => {
  const study = await db.caseStudy.create(payload);
  return study.toJSON();
};

caseStudyDAO.updateCaseStudy = async (id, updates, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  const study = await db.caseStudy.findOne({ where });
  if (!study) return null;
  await study.update(updates);
  return study.toJSON();
};

caseStudyDAO.removeCaseStudy = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  const study = await db.caseStudy.findOne({ where });
  if (!study) return false;
  await study.destroy();
  return true;
};

module.exports = caseStudyDAO;
