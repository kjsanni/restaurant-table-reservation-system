const authDAO = require("../DAOs/auth.dao");

const requireFeatureFlag = async (flag, tenantId) => {
  const config = await authDAO.getSettingValue(
    "feature_flags",
    { waitlist: true, loyalty: false, deposits: false },
    tenantId
  );
  if (!config || config[flag] !== true) {
    throw { status: 403, message: `Feature flag "${flag}" is disabled.` };
  }
};

module.exports = {
  requireFeatureFlag,
};
