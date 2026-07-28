const dataRetentionPolicyDAO = require("../DAOs/dataRetentionPolicy.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listPoliciesHandler = async (req, res) => {
  const { isActive } = req.query;
  const data = await dataRetentionPolicyDAO.list({
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, collection: data });
};

const createPolicyHandler = async (req, res) => {
  const { name, dataCategory, retentionDays, action, isActive } = req.body;
  if (!name || !dataCategory || !retentionDays) {
    return res.status(400).json({ success: false, message: "name, dataCategory, and retentionDays are required" });
  }

  const policy = await dataRetentionPolicyDAO.create({
    name,
    dataCategory,
    retentionDays,
    action: action || "delete",
    isActive: isActive ?? true,
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.data_retention_policy_created",
    "data_retention_policy",
    policy.id,
    null,
    { name, dataCategory, retentionDays },
    req.ip
  );

  res.status(201).json({ success: true, item: policy });
};

const updatePolicyHandler = async (req, res) => {
  const { retentionDays, action, isActive } = req.body;
  const policy = await dataRetentionPolicyDAO.update(req.params.id, {
    retentionDays: retentionDays ?? undefined,
    action: action ?? undefined,
    isActive: isActive ?? undefined,
  });

  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.data_retention_policy_updated",
    "data_retention_policy",
    policy.id,
    null,
    { name: policy.name },
    req.ip
  );

  res.status(200).json({ success: true, item: policy });
};

const deletePolicyHandler = async (req, res) => {
  const policy = await dataRetentionPolicyDAO.remove(req.params.id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.data_retention_policy_deleted",
    "data_retention_policy",
    policy.id,
    null,
    { name: policy.name },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listPoliciesHandler,
  createPolicyHandler,
  updatePolicyHandler,
  deletePolicyHandler,
};
