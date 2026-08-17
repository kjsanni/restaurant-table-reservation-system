const response = require("../utils/response");

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const TEMPLATE_KEY = "vertical_onboarding_templates";

const loadTemplates = async (transaction) => {
  const where = { key: TEMPLATE_KEY, tenantId: null };
  const setting = await db.setting.findOne({ where, transaction });
  return setting?.value || [];
};

const getTemplateById = async (id) => {
  const templates = await loadTemplates();
  return templates.find((t) => t.id === parseInt(id, 10));
};

const saveTemplates = async (templates, transaction) => {
  await db.setting.upsert({
    key: TEMPLATE_KEY,
    value: templates,
    tenantId: null,
    description: "Vertical onboarding templates",
  }, { transaction });
};

const recordTemplateUsage = async ({ templateId, tenantId, appliedBy, source }) => {
  if (db.templateUsage) {
    await db.templateUsage.create({
      templateId,
      tenantId,
      appliedBy,
      source,
    });
  }
};

const listTemplatesHandler = async (req, res) => {
  const templates = await loadTemplates();
  res.status(200).json({ success: true, collection: templates });
};

const createTemplateHandler = async (req, res) => {
  const { name, vertical, description, defaultSettings, defaultServiceModes, featureFlags } = req.body;
  if (!name || !vertical) {
    return response.badRequest(res, "Name and vertical are required");
  }

  const template = await db.sequelize.transaction(async (t) => {
    const templates = await loadTemplates(t);
    const newTemplate = {
      id: templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 1,
      name,
      vertical,
      description: description || "",
      defaultSettings: defaultSettings || {},
      defaultServiceModes: Array.isArray(defaultServiceModes) ? defaultServiceModes : [],
      featureFlags: featureFlags || {},
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    await saveTemplates(templates, t);
    return newTemplate;
  });

  await platformAuditDAO
    .log(
      req.user?.id || null,
      "tenant.template_created",
      "setting",
      template.id,
      null,
      { name, vertical },
      req.ip
    )
    .catch(() => {});

  res.status(201).json({ success: true, item: template });
};

const updateTemplateHandler = async (req, res) => {
  const { name, description, defaultSettings, defaultServiceModes, featureFlags } = req.body;
  const updated = await db.sequelize.transaction(async (t) => {
    const templates = await loadTemplates(t);
    const index = templates.findIndex((t) => t.id === parseInt(req.params.id, 10));
    if (index === -1) {
      return null;
    }

    templates[index] = {
      ...templates[index],
      name: name ?? templates[index].name,
      description: description ?? templates[index].description,
      defaultSettings: defaultSettings ?? templates[index].defaultSettings,
      defaultServiceModes: Array.isArray(defaultServiceModes) ? defaultServiceModes : templates[index].defaultServiceModes,
      featureFlags: featureFlags ?? templates[index].featureFlags,
      updatedAt: new Date().toISOString(),
    };

    await saveTemplates(templates, t);
    return templates[index];
  });

  if (!updated) {
    return response.notFound(res, "Template not found");
  }

  await platformAuditDAO
    .log(
      req.user?.id || null,
      "tenant.template_updated",
      "setting",
      updated.id,
      null,
      { name: updated.name },
      req.ip
    )
    .catch(() => {});

  res.status(200).json({ success: true, item: updated });
};

const deleteTemplateHandler = async (req, res) => {
  const removed = await db.sequelize.transaction(async (t) => {
    const templates = await loadTemplates(t);
    const index = templates.findIndex((t) => t.id === parseInt(req.params.id, 10));
    if (index === -1) {
      return null;
    }

    const removed = templates.splice(index, 1)[0];
    await saveTemplates(templates, t);
    return removed;
  });

  if (!removed) {
    return response.notFound(res, "Template not found");
  }

  await platformAuditDAO
    .log(
      req.user?.id || null,
      "tenant.template_deleted",
      "setting",
      removed.id,
      null,
      { name: removed.name },
      req.ip
    )
    .catch(() => {});

  res.status(200).json({ success: true });
};

const cloneTemplateHandler = async (req, res) => {
  const template = await getTemplateById(req.params.id);
  if (!template) {
    return response.notFound(res, "Template not found");
  }

  const newTemplate = await db.sequelize.transaction(async (t) => {
    const templates = await loadTemplates(t);
    const cloned = {
      ...template,
      id: templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 1,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    delete cloned.updatedAt;
    templates.push(cloned);
    await saveTemplates(templates, t);
    return cloned;
  });

  await platformAuditDAO
    .log(
      req.user?.id || null,
      "tenant.template_cloned",
      "setting",
      newTemplate.id,
      null,
      { sourceName: template.name, newId: newTemplate.id },
      req.ip
    )
    .catch(() => {});

  res.status(201).json({ success: true, item: newTemplate });
};

const getTemplateUsageHandler = async (req, res) => {
  if (!db.templateUsage) {
    return res.status(200).json({ success: true, collection: [], summary: { totalApplications: 0 } });
  }

  const usages = await db.templateUsage.findAll({
    where: {},
    order: [["appliedAt", "DESC"]],
    limit: 100,
  });

  const templates = await loadTemplates();
  const templateMap = new Map(templates.map((t) => [t.id, t.name]));

  const enriched = usages.map((u) => ({
    id: u.id,
    templateId: u.templateId,
    templateName: templateMap.get(u.templateId) || `Template #${u.templateId}`,
    tenantId: u.tenantId,
    source: u.source,
    appliedAt: u.appliedAt,
  }));

  const summary = templates.map((t) => ({
    templateId: t.id,
    templateName: t.name,
    vertical: t.vertical,
    usageCount: enriched.filter((u) => u.templateId === t.id).length,
  }));

  res.status(200).json({
    success: true,
    collection: enriched,
    summary,
  });
};

module.exports = {
  listTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  cloneTemplateHandler,
  getTemplateUsageHandler,
  getTemplateById,
  recordTemplateUsage,
};
