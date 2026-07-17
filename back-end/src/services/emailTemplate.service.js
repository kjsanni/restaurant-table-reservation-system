const emailTemplateDAO = require("../DAOs/emailTemplate.dao");

const getAllTemplates = async (tenantId) => {
  return await emailTemplateDAO.getAllTemplates(tenantId);
};

const getTemplateByKey = async (key, tenantId) => {
  return await emailTemplateDAO.getTemplateByKey(key, tenantId);
};

const getTemplateById = async (id, tenantId) => {
  return await emailTemplateDAO.getTemplateById(id, tenantId);
};

const createTemplate = async (data, tenantId) => {
  return await emailTemplateDAO.createTemplate(data, tenantId);
};

const updateTemplate = async (id, data, tenantId) => {
  return await emailTemplateDAO.updateTemplate(id, data, tenantId);
};

const deleteTemplate = async (id, tenantId) => {
  return await emailTemplateDAO.deleteTemplate(id, tenantId);
};

const renderTemplate = (template, data = {}) => {
  if (!template) return { subject: "", body: "" };
  const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");
  const body = template.body.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");
  return { subject, body };
};

module.exports = {
  getAllTemplates,
  getTemplateByKey,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  renderTemplate,
};