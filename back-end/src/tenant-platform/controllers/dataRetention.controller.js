const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listRetentionPoliciesHandler = async (req, res) => {
  const policies = await db.dataRetentionPolicy.findAll({
    order: [["dataCategory", "ASC"]],
  });
  res.status(200).json({ success: true, collection: policies });
};

const createRetentionPolicyHandler = async (req, res) => {
  const { name, dataCategory, retentionDays, action } = req.body;
  if (!name || !dataCategory || !retentionDays) {
    return res.status(400).json({ success: false, message: "name, dataCategory, and retentionDays are required" });
  }

  const policy = await db.dataRetentionPolicy.create({
    name,
    dataCategory,
    retentionDays: parseInt(retentionDays, 10),
    action: action || "delete",
    isActive: true,
  });

  await platformAuditDAO.log(
    req.user.id,
    "retention.policy_created",
    "data_retention_policy",
    policy.id,
    null,
    { name, dataCategory, retentionDays, action: policy.action },
    req.ip
  );

  res.status(201).json({ success: true, item: policy });
};

const updateRetentionPolicyHandler = async (req, res) => {
  const policy = await db.dataRetentionPolicy.findByPk(req.params.id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }

  const allowed = ["name", "dataCategory", "retentionDays", "action", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = key === "retentionDays" ? parseInt(req.body[key], 10) : req.body[key];
    }
  }

  await policy.update(updates);

  await platformAuditDAO.log(
    req.user.id,
    "retention.policy_updated",
    "data_retention_policy",
    policy.id,
    null,
    { updates },
    req.ip
  );

  res.status(200).json({ success: true, item: policy });
};

const deleteRetentionPolicyHandler = async (req, res) => {
  const policy = await db.dataRetentionPolicy.findByPk(req.params.id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }

  await policy.destroy();

  await platformAuditDAO.log(
    req.user.id,
    "retention.policy_deleted",
    "data_retention_policy",
    policy.id,
    null,
    { name: policy.name, dataCategory: policy.dataCategory },
    req.ip
  );

  res.status(200).json({ success: true });
};

const executeRetentionHandler = async (req, res) => {
  const policies = await db.dataRetentionPolicy.findAll({ where: { isActive: true } });
  const results = [];

  for (const policy of policies) {
    try {
      const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
      let affectedCount = 0;

      switch (policy.dataCategory) {
        case "platform_audit_logs":
          affectedCount = await db.platformAuditLog.destroy({ where: { createdAt: { [db.Sequelize.Op.lt]: cutoff } } });
          break;
        case "support_messages":
          affectedCount = await db.supportMessage.destroy({ where: { createdAt: { [db.Sequelize.Op.lt]: cutoff } } });
          break;
        case "support_conversations":
          affectedCount = await db.supportConversation.destroy({ where: { createdAt: { [db.Sequelize.Op.lt]: cutoff } } });
          break;
        case "support_tickets":
          affectedCount = await db.supportTicket.destroy({ where: { createdAt: { [db.Sequelize.Op.lt]: cutoff } } });
          break;
        default:
          results.push({ policyId: policy.id, dataCategory: policy.dataCategory, status: "skipped", reason: "Unknown category" });
          continue;
      }

      await policy.update({ lastRunAt: new Date(), lastRunResult: `Deleted ${affectedCount} records` });
      results.push({ policyId: policy.id, dataCategory: policy.dataCategory, status: "success", affectedCount });
    } catch (err) {
      await policy.update({ lastRunAt: new Date(), lastRunResult: `Error: ${err.message}` });
      results.push({ policyId: policy.id, dataCategory: policy.dataCategory, status: "error", error: err.message });
    }
  }

  await platformAuditDAO.log(
    req.user.id,
    "retention.executed",
    "data_retention_policy",
    null,
    null,
    { results },
    req.ip
  );

  res.status(200).json({ success: true, results });
};

module.exports = {
  listRetentionPoliciesHandler,
  createRetentionPolicyHandler,
  updateRetentionPolicyHandler,
  deleteRetentionPolicyHandler,
  executeRetentionHandler,
};
