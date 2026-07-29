const db = require("../../db/models");

const webhookEndpointDAO = {};

webhookEndpointDAO.create = async (data) => {
  return db.webhookEndpoint.create(data);
};

webhookEndpointDAO.findAll = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.webhookEndpoint.findAll({ where });
};

webhookEndpointDAO.findById = (id) => {
  return db.webhookEndpoint.findByPk(id);
};

webhookEndpointDAO.update = (id, updates) => {
  return db.webhookEndpoint.findByPk(id).then((record) => {
    if (!record) return null;
    return record.update(updates);
  });
};

webhookEndpointDAO.remove = (id) => {
  return db.webhookEndpoint.findByPk(id).then((record) => {
    if (!record) return null;
    return record.destroy();
  });
};

module.exports = webhookEndpointDAO;
