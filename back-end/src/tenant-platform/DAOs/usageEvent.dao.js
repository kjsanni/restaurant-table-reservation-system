const db = require("../../db/models");

const usageEventDAO = {};

usageEventDAO.record = async ({ tenantId, resource, action, quantity = 1, metadata = {} }) => {
  if (!tenantId) return;
  return await db.usageEvent.create({
    tenantId,
    resource,
    action,
    quantity,
    metadata,
  });
};

usageEventDAO.getTenantUsageHistory = async (tenantId, { resource, from, to, limit = 30, offset = 0 } = {}) => {
  const where = { tenantId };
  if (resource) where.resource = resource;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const { rows, count } = await db.usageEvent.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    collection: rows.map((event) => ({
      id: event.id,
      tenantId: event.tenantId,
      resource: event.resource,
      action: event.action,
      quantity: event.quantity,
      metadata: event.metadata,
      createdAt: event.createdAt,
    })),
    pagination: {
      total: count,
      limit,
      offset,
    },
  };
};

usageEventDAO.getPlatformUsageSummary = async ({ from, to } = {}) => {
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
    if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
  }

  const events = await db.usageEvent.findAll({ where });

  const summary = events.reduce((acc, event) => {
    const key = `${event.resource}:${event.action}`;
    acc[key] = (acc[key] || 0) + event.quantity;
    return acc;
  }, {});

  return {
    totalEvents: events.length,
    uniqueTenants: new Set(events.map((e) => e.tenantId)).size,
    summary,
  };
};

module.exports = usageEventDAO;
