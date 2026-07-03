const db = require("../db/models");
const EmailTemplate = db.emailTemplate;

const getAllTemplates = async () => {
  return await EmailTemplate.findAll({ order: [["name", "ASC"]] });
};

const getTemplateByKey = async (key) => {
  return await EmailTemplate.findOne({ where: { key } });
};

const getTemplateById = async (id) => {
  return await EmailTemplate.findByPk(id);
};

const createTemplate = async (data) => {
  return await EmailTemplate.create(data);
};

const updateTemplate = async (id, data) => {
  const template = await EmailTemplate.findByPk(id);
  if (!template) return null;
  return await template.update(data);
};

const deleteTemplate = async (id) => {
  const template = await EmailTemplate.findByPk(id);
  if (!template) return null;
  await template.destroy();
  return true;
};

module.exports = {
  getAllTemplates,
  getTemplateByKey,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};