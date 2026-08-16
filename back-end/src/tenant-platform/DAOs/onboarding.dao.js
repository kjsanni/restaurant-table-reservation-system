const db = require("../../db/models");
const baseDAO = require("./base.dao");

const onboardingDAO = {};

onboardingDAO.getByTenant = (tenantId) => {
// codacy-suppress NoSqlInjection
  return db.tenantOnboarding.findOne({ where: { tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
};

onboardingDAO.upsert = (tenantId, steps = []) => {
  return baseDAO.upsert(db.tenantOnboarding, { tenantId }, { tenantId, steps, completedAt: null }); // codacy-suppress nosql-injection - parameterized ORM call
};

onboardingDAO.complete = (tenantId) => {
  return db.tenantOnboarding.update({ completedAt: new Date() }, { where: { tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
};

module.exports = onboardingDAO;
