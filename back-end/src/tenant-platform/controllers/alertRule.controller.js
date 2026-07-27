const alertRuleDAO = require("../DAOs/alertRule.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

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
    return res.status(404).json({ success: false, message: "Alert rule not found" });
  }
  res.status(200).json({ success: true, item: rule });
};

const createAlertRuleHandler = async (req, res) => {
  const rule = await alertRuleDAO.create(req.body);
  await platformAuditDAO.log(
    req.user.id,
    "alert_rule.created",
    "alert_rule",
    rule.id,
    null,
    { name: rule.name, metric: rule.metric },
    req.ip
  );
  res.status(201).json({ success: true, item: rule });
};

const updateAlertRuleHandler = async (req, res) => {
  const rule = await alertRuleDAO.update(req.params.id, req.body);
  if (!rule) {
    return res.status(404).json({ success: false, message: "Alert rule not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "alert_rule.updated",
    "alert_rule",
    rule.id,
    null,
    { name: rule.name, metric: rule.metric },
    req.ip
  );
  res.status(200).json({ success: true, item: rule });
};

const deleteAlertRuleHandler = async (req, res) => {
  const rule = await alertRuleDAO.remove(req.params.id);
  if (!rule) {
    return res.status(404).json({ success: false, message: "Alert rule not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "alert_rule.deleted",
    "alert_rule",
    rule.id,
    null,
    { name: rule.name },
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  listAlertRulesHandler,
  getAlertRuleHandler,
  createAlertRuleHandler,
  updateAlertRuleHandler,
  deleteAlertRuleHandler,
};
