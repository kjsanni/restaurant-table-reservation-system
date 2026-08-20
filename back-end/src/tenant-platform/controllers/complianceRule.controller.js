const response = require("../utils/response");

const complianceRuleDAO = require("../DAOs/complianceRule.dao");
const auditLog = require("../utils/auditLog");

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
    return response.badRequest(res, "vertical, ruleKey, and label are required");
  }

  const rule = await complianceRuleDAO.create({
    vertical,
    ruleKey,
    label,
    description: description || null,
    required: required ?? true,
    frequency: frequency || null,
  });

await auditLog(req, "tenant.compliance_rule_created", "compliance_rule", rule.id, { vertical, ruleKey });

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
    return response.notFound(res, "Rule not found");
  }

  await auditLog(req, "tenant.compliance_rule_updated", "compliance_rule", rule.id, { ruleKey: rule.ruleKey });

  res.status(200).json({ success: true, item: rule });
};

const deleteRuleHandler = async (req, res) => {
  const rule = await complianceRuleDAO.remove(req.params.id);
  if (!rule) {
    return response.notFound(res, "Rule not found");
  }

  await auditLog(req, "tenant.compliance_rule_deleted", "compliance_rule", rule.id, { ruleKey: rule.ruleKey });

  res.status(200).json({ success: true });
};

module.exports = {
  listRulesHandler,
  createRuleHandler,
  updateRuleHandler,
  deleteRuleHandler,
};
