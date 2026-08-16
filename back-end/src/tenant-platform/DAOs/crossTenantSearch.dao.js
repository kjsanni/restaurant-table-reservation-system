const db = require("../../db/models");

const crossTenantSearchDAO = {};

crossTenantSearchDAO.search = async (query, filters = {}) => {
  const { Op } = db.Sequelize;
  const escapedQuery = query
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  const like = `%${escapedQuery}%`;

  if (!filters.tenantId && !filters.allowAllTenants) {
    throw { status: 400, message: "tenantId is required for cross-tenant search" };
  }

  const tenantWhere = {};
  if (filters.tenantId) tenantWhere.tenantId = filters.tenantId;

  const [customers, reservations, orders] = await Promise.all([
    db.customer.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
      where: {
        ...tenantWhere,
        [Op.or]: [
          { firstName: { [Op.like]: like } },
          { lastName: { [Op.like]: like } },
          { email: { [Op.like]: like } },
          { phone: { [Op.like]: like } },
        ],
      },
      include: [
        { model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] },
      ],
      limit: 20,
      attributes: ["id", "tenantId", "firstName", "lastName", "email", "phone", "visitCount", "createdAt"],
    }),
    db.reservation.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
      where: {
        ...tenantWhere,
        [Op.or]: [
          { notes: { [Op.like]: like } },
          { resStatus: { [Op.like]: like } },
        ],
      },
      include: [
        { model: db.customer, as: "customer", attributes: ["id", "firstName", "lastName", "email"] },
        { model: db.table, as: "table", attributes: ["id", "name"] },
        { model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] },
      ],
      limit: 20,
      attributes: ["id", "tenantId", "customerId", "tableId", "resDate", "resTime", "resStatus", "notes", "createdAt"],
    }),
    db.order.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
      where: {
        ...tenantWhere,
        [Op.or]: [
          { status: { [Op.like]: like } },
          { paymentStatus: { [Op.like]: like } },
        ],
      },
      include: [
        { model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] },
      ],
      limit: 20,
      attributes: ["id", "tenantId", "status", "paymentStatus", "total", "createdAt"],
    }),
  ]);

  return {
    customers: customers.map((c) => ({ type: "customer", ...c.toJSON() })),
    reservations: reservations.map((r) => ({ type: "reservation", ...r.toJSON() })),
    orders: orders.map((o) => ({ type: "order", ...o.toJSON() })),
  };
};

module.exports = crossTenantSearchDAO;
