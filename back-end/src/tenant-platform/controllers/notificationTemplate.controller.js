const response = require("../utils/response");

const notificationTemplateDAO = require("../DAOs/notificationTemplate.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listTemplatesHandler = async (req, res) => {
  const { channel, isActive } = req.query;
  const data = await notificationTemplateDAO.list({
    channel: channel || undefined,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, collection: data });
};

const createTemplateHandler = async (req, res) => {
  const { key, channel, subject, body, isActive } = req.body;
  if (!key || !channel || !body) {
    return response.badRequest(res, "key, channel, and body are required");
  }

  const existing = await notificationTemplateDAO.findByKey(key);
  if (existing) {
    return res.status(409).json({ success: false, message: `Template with key "${key}" already exists` });
  }

  const template = await notificationTemplateDAO.create({
    key,
    channel,
    subject: subject || null,
    body,
    isActive: isActive ?? true,
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.notification_template_created",
    "notification_template",
    template.id,
    null,
    { key, channel },
    req.ip
  );

  res.status(201).json({ success: true, item: template });
};

const updateTemplateHandler = async (req, res) => {
  const { subject, body, isActive } = req.body;
  const template = await notificationTemplateDAO.update(req.params.id, {
    subject: subject ?? undefined,
    body: body ?? undefined,
    isActive: isActive ?? undefined,
  });

  if (!template) {
    return response.notFound(res, "Template not found");
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.notification_template_updated",
    "notification_template",
    template.id,
    null,
    { key: template.key },
    req.ip
  );

  res.status(200).json({ success: true, item: template });
};

const deleteTemplateHandler = async (req, res) => {
  const template = await notificationTemplateDAO.remove(req.params.id);
  if (!template) {
    return response.notFound(res, "Template not found");
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.notification_template_deleted",
    "notification_template",
    template.id,
    null,
    { key: template.key },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
};
