const db = require("../../db/models");

const invoiceDAO = {};

invoiceDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  return db.invoice.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

invoiceDAO.getById = (id) => db.invoice.findByPk(id);

invoiceDAO.create = (data) => db.invoice.create(data);

invoiceDAO.update = (id, updates) => {
  return db.invoice.findByPk(id).then((inv) => {
    if (!inv) return null;
    return inv.update(updates);
  });
};

invoiceDAO.remove = (id) => {
  return db.invoice.findByPk(id).then((inv) => {
    if (!inv) return null;
    return inv.destroy();
  });
};

module.exports = invoiceDAO;
