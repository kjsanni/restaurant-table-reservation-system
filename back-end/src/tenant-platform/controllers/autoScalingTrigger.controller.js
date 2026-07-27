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
    return res.status(404).json({ success: false, message: "Auto scaling trigger not found" });
  }
  res.status(200).json({ success: true, item: trigger });
};

const createAutoScalingTriggerHandler = async (req, res) => {
  const trigger = await autoScalingTriggerDAO.create(req.body);
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
  const trigger = await autoScalingTriggerDAO.update(req.params.id, req.body);
  if (!trigger) {
    return res.status(404).json({ success: false, message: "Auto scaling trigger not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "auto_scaling_trigger.updated",
    "auto_scaling_trigger",
    trigger.id,
    null,
    { name: trigger.name },
    req.ip
  );
  res.status(200).json({ success: true, item: trigger });
};

const deleteAutoScalingTriggerHandler = async (req, res) => {
  const trigger = await autoScalingTriggerDAO.remove(req.params.id);
  if (!trigger) {
    return res.status(404).json({ success: false, message: "Auto scaling trigger not found" });
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
