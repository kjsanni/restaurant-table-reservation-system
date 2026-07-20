const usageDAO = require("../DAOs/usage.dao");
const { requirePermission } = require("../../middleware/auth");

const listTenantUsageHandler = async (req, res) => {
  const { plan, status } = req.query;
  const data = await usageDAO.getAllTenantsUsage({ plan, status });
  res.status(200).json({ success: true, collection: data });
};

const getTenantUsageHandler = async (req, res) => {
  const data = await usageDAO.getTenantUsage(req.params.id);
  if (!data) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  res.status(200).json({ success: true, item: data });
};

module.exports = {
  listTenantUsageHandler,
  getTenantUsageHandler,
};
