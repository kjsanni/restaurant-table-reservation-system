const complianceRuleDAO = require("../DAOs/complianceRule.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listRulesHandler = async (req, res) => {
  const { vertical } = req.query;
  const data = await complianceRuleDAO.list({
    vertical: vertical || undefined,
  });
  res.status(200).json({ success: true, collection: data });
};

const createRuleHandler = async (req, res) => {
  const { vertical, ruleKey, label, description, required, frequency } = req.body;
  if (!vertical || !ruleKey || !label) {
    return res.status(400).json({ success: false, message: "vertical, ruleKey, and label are required" });
  }

  const rule = await complianceRuleDAO.create({
    vertical,
    ruleKey,
    label,
    description: description || null,
    required: required ?? true,
    frequency: frequency || null,
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.compliance_rule_created",
    "compliance_rule",
    rule.id,
    null,
    { vertical, ruleKey },
    req.ip
  );

  res.status(201).json({ success: true, item: rule });
};

const updateRuleHandler = async (req, res) => {
  const { label, description, required, frequency } = req.body;
  const rule = await complianceRuleDAO.update(req.params.id, {
    label: label ?? undefined,
    description: description ?? undefined,
    required: required ?? undefined,
    frequency: frequency ?? undefined,
  });

  if (!rule) {
    return res.status(404).json({ success: false, message: "Rule not found" });
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.compliance_rule_updated",
    "compliance_rule",
    rule.id,
    null,
    { ruleKey: rule.ruleKey },
    req.ip
  );

  res.status(200).json({ success: true, item: rule });
};

const deleteRuleHandler = async (req, res) => {
  const rule = await complianceRuleDAO.remove(req.params.id);
  if (!rule) {
    return res.status(404).json({ success: false, message: "Rule not found" });
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.compliance_rule_deleted",
    "compliance_rule",
    rule.id,
    null,
    { ruleKey: rule.ruleKey },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listRulesHandler,
  createRuleHandler,
  updateRuleHandler,
  deleteRuleHandler,
};
