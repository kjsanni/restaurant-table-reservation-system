const db = require("../../db/models");

const webhookEndpointDAO = {};

webhookEndpointDAO.create = async (data) => {
  return db.webhookEndpoint.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

webhookEndpointDAO.findAll = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.webhookEndpoint.findAll({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

webhookEndpointDAO.findById = (id, tenantId = null) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.webhookEndpoint.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

webhookEndpointDAO.update = (id, updates, tenantId = null) => {
  return db.webhookEndpoint.findOne({ where: { id, ...(tenantId ? { tenantId } : {}) } }).then((record) => { // codacy-suppress nosql-injection - parameterized ORM call
    if (!record) return null;
    return record.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  });
};

webhookEndpointDAO.remove = (id, tenantId = null) => {
  return db.webhookEndpoint.findOne({ where: { id, ...(tenantId ? { tenantId } : {}) } }).then((record) => { // codacy-suppress nosql-injection - parameterized ORM call
    if (!record) return null;
    return record.destroy();
  });
};

module.exports = webhookEndpointDAO;
