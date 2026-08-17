const response = require("../utils/response");

const usageDAO = require("../DAOs/usage.dao");
const usageEventDAO = require("../DAOs/usageEvent.dao");

const listTenantUsageHandler = async (req, res) => {
  const { plan, status } = req.query;
  const data = await usageDAO.getAllTenantsUsage({ plan, status });
  res.status(200).json({ success: true, collection: data });
};

const getTenantUsageHandler = async (req, res) => {
  const data = await usageDAO.getTenantUsage(req.params.id);
  if (!data) {
    return response.notFound(res, "Tenant not found");
  }
  res.status(200).json({ success: true, item: data });
};

const getTenantUsageHistoryHandler = async (req, res) => {
  const { resource, from, to, limit, offset } = req.query;
  const data = await usageEventDAO.getTenantUsageHistory(req.params.id, {
    resource,
    from,
    to,
    limit: limit ? parseInt(limit, 10) : 30,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  res.status(200).json({ success: true, ...data });
};

const getPlatformUsageSummaryHandler = async (req, res) => {
  const { from, to } = req.query;
  const data = await usageEventDAO.getPlatformUsageSummary({ from, to });
  res.status(200).json({ success: true, item: data });
};

module.exports = {
  listTenantUsageHandler,
  getTenantUsageHandler,
  getTenantUsageHistoryHandler,
  getPlatformUsageSummaryHandler,
};
