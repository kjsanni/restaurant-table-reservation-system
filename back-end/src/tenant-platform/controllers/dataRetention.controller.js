const response = require("../utils/response");

const db = require("../../db/models");
const auditLog = require("../utils/auditLog");

const getTenantConversationIds = async (tenantId) => {
  const conversations = await db.supportConversation.findAll({
    where: { tenantId },
    attributes: ["id"],
  });
  return conversations.map((c) => c.id);
};

const listRetentionPoliciesHandler = async (req, res) => {
  const policies = await db.dataRetentionPolicy.findAll({
    order: [["dataCategory", "ASC"]],
  });
  res.status(200).json({ success: true, collection: policies });
};

const createRetentionPolicyHandler = async (req, res) => {
  const { name, dataCategory, retentionDays, action } = req.body;
  if (!name || !dataCategory || !retentionDays) {
    return response.badRequest(res, "name, dataCategory, and retentionDays are required");
  }

  const policy = await db.dataRetentionPolicy.create({
    name,
    dataCategory,
    retentionDays: parseInt(retentionDays, 10),
    action: action || "delete",
    isActive: true,
  });

await auditLog(req, "retention.policy_created", "data_retention_policy", policy.id, { name, dataCategory, retentionDays, action: policy.action });

  res.status(201).json({ success: true, item: policy });
};

const updateRetentionPolicyHandler = async (req, res) => {
  const policy = await db.dataRetentionPolicy.findByPk(req.params.id);
  if (!policy) {
    return response.notFound(res, "Policy not found");
  }

  const allowed = ["name", "dataCategory", "retentionDays", "action", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = key === "retentionDays" ? parseInt(req.body[key], 10) : req.body[key];
    }
  }

  await policy.update(updates);

  await auditLog(req, "retention.policy_updated", "data_retention_policy", policy.id, { updates });

  res.status(200).json({ success: true, item: policy });
};

const deleteRetentionPolicyHandler = async (req, res) => {
  const policy = await db.dataRetentionPolicy.findByPk(req.params.id);
  if (!policy) {
    return response.notFound(res, "Policy not found");
  }

  await policy.destroy();

await auditLog(req, "retention.policy_deleted", "data_retention_policy", policy.id, { name: policy.name, dataCategory: policy.dataCategory });

  res.status(200).json({ success: true });
};

const executeRetentionHandler = async (req, res) => {
  const policies = await db.dataRetentionPolicy.findAll({ where: { isActive: true } });
  const results = [];

  for (const policy of policies) {
    try {
      const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
      let affectedCount = 0;
      const tenantId = req.tenant?.id;

      switch (policy.dataCategory) {
        case "platform_audit_logs":
          affectedCount = await db.platformAuditLog.destroy({
            where: {
              createdAt: { [db.Sequelize.Op.lt]: cutoff },
              ...(tenantId ? { tenantId } : {}),
            },
          });
          break;
        case "support_messages":
          affectedCount = await db.supportMessage.destroy({
            where: {
              createdAt: { [db.Sequelize.Op.lt]: cutoff },
              ...(tenantId ? { conversationId: { [db.Sequelize.Op.in]: await getTenantConversationIds(tenantId) } } : {}),
            },
          });
          break;
        case "support_conversations":
          affectedCount = await db.supportConversation.destroy({
            where: {
              createdAt: { [db.Sequelize.Op.lt]: cutoff },
              ...(tenantId ? { tenantId } : {}),
            },
          });
          break;
        case "support_tickets":
          affectedCount = await db.supportTicket.destroy({
            where: {
              createdAt: { [db.Sequelize.Op.lt]: cutoff },
              ...(tenantId ? { tenantId } : {}),
            },
          });
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

  await auditLog(req, "retention.executed", "data_retention_policy", null, { results });

  res.status(200).json({ success: true, results });
};

module.exports = {
  listRetentionPoliciesHandler,
  createRetentionPolicyHandler,
  updateRetentionPolicyHandler,
  deleteRetentionPolicyHandler,
  executeRetentionHandler,
};
