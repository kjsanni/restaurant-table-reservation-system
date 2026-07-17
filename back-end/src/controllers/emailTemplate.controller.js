const emailTemplateService = require("../services/emailTemplate.service");

const getAllHandler = async (req, res) => {
  const templates = await emailTemplateService.getAllTemplates(req.tenant?.id);
  return res.status(200).json({ success: true, templates });
};

const getByIdHandler = async (req, res) => {
  const template = await emailTemplateService.getTemplateById(req.params.id, req.tenant?.id);
  if (!template) {
    return res.status(404).json({ success: false, message: "Template not found" });
  }
  return res.status(200).json({ success: true, template });
};

const createHandler = async (req, res) => {
  const { key, name, subject, body, variables, isActive } = req.body;
  if (!key || !name || !subject || !body) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const template = await emailTemplateService.createTemplate({
    key,
    name,
    subject,
    body,
    variables: variables || [],
    isActive: isActive !== false,
  }, req.tenant?.id);
  return res.status(201).json({ success: true, template });
};

const updateHandler = async (req, res) => {
  const template = await emailTemplateService.updateTemplate(req.params.id, req.body, req.tenant?.id);
  if (!template) {
    return res.status(404).json({ success: false, message: "Template not found" });
  }
  return res.status(200).json({ success: true, template });
};

const deleteHandler = async (req, res) => {
  const result = await emailTemplateService.deleteTemplate(req.params.id, req.tenant?.id);
  if (!result) {
    return res.status(404).json({ success: false, message: "Template not found" });
  }
  return res.status(200).json({ success: true, message: "Template deleted" });
};

module.exports = {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
};