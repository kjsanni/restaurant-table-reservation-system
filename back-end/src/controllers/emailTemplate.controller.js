const emailTemplateService = require("../services/emailTemplate.service");
const emailService = require("../services/emailService");

const isValidEmail = (to) => {
  if (!to || typeof to !== "string") return false;
  const at = to.indexOf("@");
  const dot = to.lastIndexOf(".");
  return at > 0 && dot > at && dot < to.length - 1;
};

const sendTestEmailHandler = async (req, res) => {
  const { to } = req.body || {};
  if (!to || !isValidEmail(to)) {
    return res.status(400).json({ success: false, message: "Valid recipient email is required" });
  }
  await emailService.sendEmail({
    to,
    subject: "Test email from Restaurant Reservation System",
    text: "Your email settings are working correctly.",
    html: "<p>Your email settings are working correctly.</p>",
  });
  return res.status(200).json({ success: true, message: "Test email sent" });
};

const sendTemplateTestHandler = async (req, res) => {
  const { templateType, to, data } = req.body || {};
  if (!to || !isValidEmail(to)) {
    return res.status(400).json({ success: false, message: "Valid recipient email is required" });
  }
  if (!templateType) {
    return res.status(400).json({ success: false, message: "templateType is required" });
  }
  await emailService.sendTemplate({ templateType, to, data: data || {} });
  return res.status(200).json({ success: true, message: "Template test email sent" });
};

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
  sendTestEmailHandler,
  sendTemplateTestHandler,
};