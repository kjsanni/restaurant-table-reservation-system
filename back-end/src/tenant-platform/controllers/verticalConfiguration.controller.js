const response = require("../utils/response");

const verticalConfigurationDAO = require("../DAOs/verticalConfiguration.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const VALID_VERTICALS = ["restaurant", "salon", "event"];

const logVerticalConfigAudit = async (userId, event, configId, extra, ip) => {
  await platformAuditDAO
    .log(userId, event, "vertical_configuration", configId, null, extra, ip)
    .catch((err) => {
      console.error(`${event} audit log failed:`, err.message);
    });
};

const listVerticalConfigurationsHandler = async (req, res) => {
  const { vertical, isActive } = req.query;
  const configs = await verticalConfigurationDAO.findAll({
    vertical,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, collection: configs });
};

const getVerticalConfigurationHandler = async (req, res) => {
  const config = await verticalConfigurationDAO.findById(parseInt(req.params.id, 10));
  if (!config) {
    return response.notFound(res, "Vertical configuration not found");
  }
  res.status(200).json({ success: true, item: config });
};

const createVerticalConfigurationHandler = async (req, res) => {
  const {
    vertical,
    useCaseType,
    name,
    description,
    featureFlags,
    serviceModes,
    allowedIntegrations,
    uiComponents,
    breakglassRequired,
    isActive,
  } = req.body;

  if (!vertical || !VALID_VERTICALS.includes(vertical)) {
    return response.badRequest(res, `Vertical must be one of: ${VALID_VERTICALS.join(", ")}`);
  }
  if (!useCaseType || typeof useCaseType !== "string" || useCaseType.trim().length === 0) {
    return response.badRequest(res, "useCaseType is required");
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return response.badRequest(res, "Name is required");
  }

  const existing = await verticalConfigurationDAO.findByVerticalAndType(vertical, useCaseType.trim());
  if (existing) {
    return response.conflict(res, `Configuration for ${vertical}/${useCaseType} already exists`);
  }

  const config = await verticalConfigurationDAO.create({
    vertical,
    useCaseType: useCaseType.trim(),
    name: name.trim(),
    description: description || "",
    featureFlags: featureFlags || {},
    serviceModes: Array.isArray(serviceModes) ? serviceModes : [],
    allowedIntegrations: Array.isArray(allowedIntegrations) ? allowedIntegrations : [],
    uiComponents: uiComponents || {},
    breakglassRequired: breakglassRequired !== false,
    isActive: isActive !== false,
  });

  await logVerticalConfigAudit(
    req.user?.id || null,
    "vertical_configuration.created",
    config.id,
    { vertical, useCaseType, name: config.name },
    req.ip
  );

  res.status(201).json({ success: true, item: config });
};

const updateVerticalConfigurationHandler = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await verticalConfigurationDAO.findById(id);
  if (!existing) {
    return response.notFound(res, "Vertical configuration not found");
  }

  const {
    useCaseType,
    name,
    description,
    featureFlags,
    serviceModes,
    allowedIntegrations,
    uiComponents,
    breakglassRequired,
    isActive,
  } = req.body;

  if (useCaseType !== undefined && (typeof useCaseType !== "string" || useCaseType.trim().length === 0)) {
    return response.badRequest(res, "useCaseType must be a non-empty string");
  }

  const updated = await verticalConfigurationDAO.update(id, {
    ...(useCaseType !== undefined && { useCaseType: useCaseType.trim() }),
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description }),
    ...(featureFlags !== undefined && { featureFlags }),
    ...(serviceModes !== undefined && { serviceModes: Array.isArray(serviceModes) ? serviceModes : existing.serviceModes }),
    ...(allowedIntegrations !== undefined && { allowedIntegrations: Array.isArray(allowedIntegrations) ? allowedIntegrations : existing.allowedIntegrations }),
    ...(uiComponents !== undefined && { uiComponents }),
    ...(breakglassRequired !== undefined && { breakglassRequired }),
    ...(isActive !== undefined && { isActive }),
  });

  await logVerticalConfigAudit(
    req.user?.id || null,
    "vertical_configuration.updated",
    id,
    { vertical: existing.vertical, useCaseType: existing.useCaseType },
    req.ip
  );

  res.status(200).json({ success: true, item: updated });
};

const deleteVerticalConfigurationHandler = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await verticalConfigurationDAO.findById(id);
  if (!existing) {
    return response.notFound(res, "Vertical configuration not found");
  }

  await verticalConfigurationDAO.remove(id);

  await logVerticalConfigAudit(
    req.user?.id || null,
    "vertical_configuration.deleted",
    id,
    { vertical: existing.vertical, useCaseType: existing.useCaseType, name: existing.name },
    req.ip
  );

  res.status(200).json({ success: true });
};

const getVerticalConfigurationSummaryHandler = async (req, res) => {
  const configs = await verticalConfigurationDAO.findAll({});
  const summary = configs.map((c) => ({
    id: c.id,
    vertical: c.vertical,
    useCaseType: c.useCaseType,
    name: c.name,
    isActive: c.isActive,
    breakglassRequired: c.breakglassRequired,
    featureCount: Object.keys(c.featureFlags || {}).length,
    integrationCount: Array.isArray(c.allowedIntegrations) ? c.allowedIntegrations.length : 0,
    serviceModeCount: Array.isArray(c.serviceModes) ? c.serviceModes.length : 0,
  }));
  res.status(200).json({ success: true, collection: summary });
};

module.exports = {
  listVerticalConfigurationsHandler,
  getVerticalConfigurationHandler,
  createVerticalConfigurationHandler,
  updateVerticalConfigurationHandler,
  deleteVerticalConfigurationHandler,
  getVerticalConfigurationSummaryHandler,
};
