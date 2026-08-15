const response = require("../utils/response");

const autoScalingTriggerDAO = require("../DAOs/autoScalingTrigger.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listAutoScalingTriggersHandler = async (req, res) => {
  const { metric, isActive, limit } = req.query;
  const data = await autoScalingTriggerDAO.list({
    metric,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getAutoScalingTriggerHandler = async (req, res) => {
  const trigger = await autoScalingTriggerDAO.findById(req.params.id);
  if (!trigger) {
    return response.notFound(res, "Auto scaling trigger not found");
  }
  res.status(200).json({ success: true, item: trigger });
};

const createAutoScalingTriggerHandler = async (req, res) => {
  const allowed = ["name", "metric", "operator", "threshold", "action", "minInstances", "maxInstances", "cooldownMinutes", "isActive"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }

  if (!data.name || !data.metric || !data.action) {
    return response.badRequest(res, "name, metric and action are required");
  }

  const trigger = await autoScalingTriggerDAO.create(data);
  await platformAuditDAO.log(
    req.user.id,
    "auto_scaling_trigger.created",
    "auto_scaling_trigger",
    trigger.id,
    null,
    { name: trigger.name, metric: trigger.metric },
    req.ip
  );
  res.status(201).json({ success: true, item: trigger });
};

const updateAutoScalingTriggerHandler = async (req, res) => {
  const trigger = await autoScalingTriggerDAO.findById(req.params.id);
  if (!trigger) {
    return response.notFound(res, "Auto scaling trigger not found");
  }

  const allowed = ["name", "metric", "operator", "threshold", "action", "minInstances", "maxInstances", "cooldownMinutes", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const updated = await autoScalingTriggerDAO.update(req.params.id, updates);
  await platformAuditDAO.log(
    req.user.id,
    "auto_scaling_trigger.updated",
    "auto_scaling_trigger",
    trigger.id,
    null,
    { name: updated.name, metric: updated.metric },
    req.ip
  );
  res.status(200).json({ success: true, item: updated });
};

const deleteAutoScalingTriggerHandler = async (req, res) => {
  const trigger = await autoScalingTriggerDAO.remove(req.params.id);
  if (!trigger) {
    return response.notFound(res, "Auto scaling trigger not found");
  }
  await platformAuditDAO.log(
    req.user.id,
    "auto_scaling_trigger.deleted",
    "auto_scaling_trigger",
    trigger.id,
    null,
    { name: trigger.name },
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  listAutoScalingTriggersHandler,
  getAutoScalingTriggerHandler,
  createAutoScalingTriggerHandler,
  updateAutoScalingTriggerHandler,
  deleteAutoScalingTriggerHandler,
};
