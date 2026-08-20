const response = require("../utils/response");

const alertRuleDAO = require("../DAOs/alertRule.dao");
const auditLog = require("../utils/auditLog");

const listAlertRulesHandler = async (req, res) => {
  const { isActive, metric, limit } = req.query;
  const data = await alertRuleDAO.list({
    isActive: isActive !== undefined ? isActive === "true" : undefined,
    metric,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getAlertRuleHandler = async (req, res) => {
  const rule = await alertRuleDAO.findById(req.params.id);
  if (!rule) {
    return response.notFound(res, "Alert rule not found");
  }
  res.status(200).json({ success: true, item: rule });
};

const createAlertRuleHandler = async (req, res) => {
  const allowed = ["name", "description", "metric", "condition", "threshold", "channels", "recipients", "isActive"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }

  if (!data.name || !data.metric) {
    return response.badRequest(res, "name and metric are required");
  }

  const rule = await alertRuleDAO.create(data);
await auditLog(req, "alert_rule.created", "alert_rule", rule.id, { name: rule.name, metric: rule.metric });
  res.status(201).json({ success: true, item: rule });
};

const updateAlertRuleHandler = async (req, res) => {
  const rule = await alertRuleDAO.findById(req.params.id);
  if (!rule) {
    return response.notFound(res, "Alert rule not found");
  }

  const allowed = ["name", "description", "metric", "condition", "threshold", "channels", "recipients", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const updated = await alertRuleDAO.update(req.params.id, updates);
await auditLog(req, "alert_rule.updated", "alert_rule", rule.id, { name: updated.name, metric: updated.metric });
  res.status(200).json({ success: true, item: updated });
};

const deleteAlertRuleHandler = async (req, res) => {
  const rule = await alertRuleDAO.remove(req.params.id);
  if (!rule) {
    return response.notFound(res, "Alert rule not found");
  }
  await auditLog(req, "alert_rule.deleted", "alert_rule", rule.id, { name: rule.name });
  res.status(200).json({ success: true });
};

module.exports = {
  listAlertRulesHandler,
  getAlertRuleHandler,
  createAlertRuleHandler,
  updateAlertRuleHandler,
  deleteAlertRuleHandler,
};
