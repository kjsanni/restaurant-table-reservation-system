const response = require("../utils/response");

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const TEMPLATE_KEY = "support_response_templates";

const loadTemplates = async () => {
  const setting = await db.setting.findOne({ where: { key: TEMPLATE_KEY, tenantId: null } });
  return setting?.value || [];
};

const listTemplatesHandler = async (req, res) => {
  const templates = await loadTemplates();
  res.status(200).json({ success: true, collection: templates });
};

const createTemplateHandler = async (req, res) => {
  const { title, body, category } = req.body;
  if (!title || !body) {
    return response.badRequest(res, "Title and body are required");
  }

  const templates = await loadTemplates();
  const template = {
    id: templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 1,
    title,
    body,
    category: category || "general",
    createdAt: new Date().toISOString(),
  };
  templates.push(template);

  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Support agent response templates",
  });

await auditLog(req, "support.template_created", "setting", template.id, { title, category });

  res.status(201).json({ success: true, item: template });
};

const updateTemplateHandler = async (req, res) => {
  const { title, body, category } = req.body;
  const templates = await loadTemplates();
  const index = templates.findIndex((t) => t.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return response.notFound(res, "Template not found");
  }

  const previous = { ...templates[index] };
  templates[index] = {
    ...templates[index],
    title: title ?? templates[index].title,
    body: body ?? templates[index].body,
    category: category ?? templates[index].category,
    updatedAt: new Date().toISOString(),
  };

  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Support agent response templates",
  });

await auditLog(req, "support.template_updated", "setting", templates[index].id, { changes: { from: previous, to: templates[index] } });

  res.status(200).json({ success: true, item: templates[index] });
};

const deleteTemplateHandler = async (req, res) => {
  const templates = await loadTemplates();
  const index = templates.findIndex((t) => t.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return response.notFound(res, "Template not found");
  }

  const removed = templates.splice(index, 1)[0];

  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Support agent response templates",
  });

  await auditLog(req, "support.template_deleted", "setting", removed.id, { title: removed.title });

  res.status(200).json({ success: true });
};

module.exports = {
  listTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
};
