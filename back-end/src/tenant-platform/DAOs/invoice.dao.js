const db = require("../../db/models");

const invoiceDAO = {};

invoiceDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.locationId) where.locationId = filters.locationId;

  const include = [];
  if (!filters.locationId) {
    include.push({
      model: db.location,
      as: "location",
      attributes: ["id", "name"],
    });
  }

  return db.invoice.findAll({
    where,
    include,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

invoiceDAO.getById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.invoice.findOne({ where });
};

invoiceDAO.create = (data) => {
  return db.invoice.create(data);
};

invoiceDAO.update = (id, updates, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.invoice.findOne({ where }).then((inv) => {
    if (!inv) return null;
    return inv.update(updates);
  });
};

invoiceDAO.remove = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.invoice.findOne({ where }).then((inv) => {
    if (!inv) return null;
    return inv.destroy();
  });
};

module.exports = invoiceDAO;
