const db = require("../db/models");
const EmailTemplate = db.emailTemplate;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const getAllTemplates = async (tenantId) => {
  return await EmailTemplate.findAll({
    where: withTenant({}, tenantId),
    order: [["name", "ASC"]],
  });
};

const getTemplateByKey = async (key, tenantId) => {
  return await EmailTemplate.findOne({ where: withTenant({ key }, tenantId) });
};

const getTemplateById = async (id, tenantId) => {
  return await EmailTemplate.findOne({
    where: withTenant({ id }, tenantId),
  });
};

const createTemplate = async (data, tenantId) => {
  return await EmailTemplate.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const updateTemplate = async (id, data, tenantId) => {
  const template = await EmailTemplate.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!template) return null;
  return await template.update(data);
};

const deleteTemplate = async (id, tenantId) => {
  const template = await EmailTemplate.findOne({
    where: withTenant({ id }, tenantId),
  });
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