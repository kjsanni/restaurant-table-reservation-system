const emailTemplateDAO = require("../DAOs/emailTemplate.dao");

const getAllTemplates = async () => {
  return await emailTemplateDAO.getAllTemplates();
};

const getTemplateByKey = async (key) => {
  return await emailTemplateDAO.getTemplateByKey(key);
};

const getTemplateById = async (id) => {
  return await emailTemplateDAO.getTemplateById(id);
};

const createTemplate = async (data) => {
  return await emailTemplateDAO.createTemplate(data);
};

const updateTemplate = async (id, data) => {
  return await emailTemplateDAO.updateTemplate(id, data);
};

const deleteTemplate = async (id) => {
  return await emailTemplateDAO.deleteTemplate(id);
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