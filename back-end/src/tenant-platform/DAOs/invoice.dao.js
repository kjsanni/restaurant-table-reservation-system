const db = require("../../db/models");

const invoiceDAO = {};

invoiceDAO.list = async (filters = {}) => {
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

  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const pageSize = filters.limit
    ? parseInt(filters.limit, 10)
    : filters.pageSize
    ? parseInt(filters.pageSize, 10)
    : 100;
  const offset =
    filters.offset !== undefined
      ? parseInt(filters.offset, 10)
      : (page - 1) * pageSize;

  const { rows, count } = await db.invoice.findAndCountAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include,
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
  });
  return { collection: rows, total: count };
};

invoiceDAO.getById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.invoice.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

invoiceDAO.create = (data) => {
  return db.invoice.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

invoiceDAO.update = (id, updates, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.invoice.findOne({ where }).then((inv) => { // codacy-suppress nosql-injection - parameterized ORM call
    if (!inv) return null;
    return inv.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  });
};

invoiceDAO.remove = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.invoice.findOne({ where }).then((inv) => { // codacy-suppress nosql-injection - parameterized ORM call
    if (!inv) return null;
    return inv.destroy();
  });
};

module.exports = invoiceDAO;
