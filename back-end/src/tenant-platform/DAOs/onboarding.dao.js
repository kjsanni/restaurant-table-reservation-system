const db = require("../../db/models");

const onboardingDAO = {};

onboardingDAO.getByTenant = (tenantId) => {
// codacy-suppress NoSqlInjection
  return db.tenantOnboarding.findOne({ where: { tenantId } });
};

onboardingDAO.upsert = (tenantId, steps = []) => {
  return db.tenantOnboarding.findOne({ where: { tenantId } }).then((record) => {
    if (!record) {
      return db.tenantOnboarding.create({ tenantId, steps, completedAt: null });
    }
    return record.update({ steps });
  });
};

onboardingDAO.complete = (tenantId) => {
  return db.tenantOnboarding.update({ completedAt: new Date() }, { where: { tenantId } });
};

module.exports = onboardingDAO;
