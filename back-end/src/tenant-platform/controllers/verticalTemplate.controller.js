const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const TEMPLATE_KEY = "vertical_onboarding_templates";

const loadTemplates = async () => {
  const setting = await db.setting.findOne({ where: { key: TEMPLATE_KEY, tenantId: null } });
  return setting?.value || [];
};

const listTemplatesHandler = async (req, res) => {
  const templates = await loadTemplates();
  res.status(200).json({ success: true, collection: templates });
};

const createTemplateHandler = async (req, res) => {
  const { name, vertical, description, defaultSettings, defaultServiceModes } = req.body;
  if (!name || !vertical) {
    return res.status(400).json({ success: false, message: "Name and vertical are required" });
  }

  const templates = await loadTemplates();
  const template = {
    id: templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 1,
    name,
    vertical,
    description: description || "",
    defaultSettings: defaultSettings || {},
    defaultServiceModes: defaultServiceModes || [],
    createdAt: new Date().toISOString(),
  };
  templates.push(template);

  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Vertical onboarding templates",
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.template_created",
    "setting",
    template.id,
    null,
    { name, vertical },
    req.ip
  );

  res.status(201).json({ success: true, item: template });
};

const updateTemplateHandler = async (req, res) => {
  const { name, description, defaultSettings, defaultServiceModes } = req.body;
  const templates = await loadTemplates();
  const index = templates.findIndex((t) => t.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Template not found" });
  }

  templates[index] = {
    ...templates[index],
    name: name ?? templates[index].name,
    description: description ?? templates[index].description,
    defaultSettings: defaultSettings ?? templates[index].defaultSettings,
    defaultServiceModes: defaultServiceModes ?? templates[index].defaultServiceModes,
    updatedAt: new Date().toISOString(),
  };

  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Vertical onboarding templates",
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.template_updated",
    "setting",
    templates[index].id,
    null,
    { name: templates[index].name },
    req.ip
  );

  res.status(200).json({ success: true, item: templates[index] });
};

const deleteTemplateHandler = async (req, res) => {
  const templates = await loadTemplates();
  const index = templates.findIndex((t) => t.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Template not found" });
  }

  const removed = templates.splice(index, 1)[0];

  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Vertical onboarding templates",
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.template_deleted",
    "setting",
    removed.id,
    null,
    { name: removed.name },
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
