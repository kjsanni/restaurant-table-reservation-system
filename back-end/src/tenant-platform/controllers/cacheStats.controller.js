const { getCacheStats, resetCacheStats } = require("../../utils/cache");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const getCacheStatsHandler = async (req, res) => {
  const stats = getCacheStats();
  const hitRate = stats.gets > 0 ? ((stats.hits / stats.gets) * 100).toFixed(2) : "0.00";
  res.status(200).json({
    success: true,
    data: {
      ...stats,
      hitRate: `${hitRate}%`,
    },
  });
};

const resetCacheStatsHandler = async (req, res) => {
  resetCacheStats();
  await platformAuditDAO.log(
    req.user?.id || null,
    "monitoring.cache_stats_reset",
    "system",
    null,
    null,
    {},
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  getCacheStatsHandler,
  resetCacheStatsHandler,
};
