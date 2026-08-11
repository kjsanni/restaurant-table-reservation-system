const db = require("../db/models");
const { Op } = db.Sequelize;

const createTip = async (tenantId, data) => {
  return await db.whistleblowerTip.create({
    ...data,
    tenantId: tenantId || null,
  });
};

const getTips = async (tenantId, filters = {}, pagination = {}) => {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt[Op.gte] = new Date(filters.from);
    if (filters.to) where.createdAt[Op.lte] = new Date(filters.to);
  }

  const opts = {
    where,
    order: [["createdAt", "DESC"]],
  };

  if (pagination.limit) opts.limit = pagination.limit;
  if (pagination.offset !== undefined) opts.offset = pagination.offset;

  const { rows, count } = await db.whistleblowerTip.findAndCountAll(opts);
  return { tips: rows, total: count };
};

const getTipById = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  return await db.whistleblowerTip.findOne({
    where: { id, ...(tenantId ? { tenantId } : {}) },
  });
};

const updateTipStatus = async (id, tenantId, data) => {
  const tip = await getTipById(id, tenantId);
  if (!tip) return null;

  const allowed = ["status", "severity", "resolutionNotes", "resolvedBy", "resolvedAt"];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  if (update.status === "resolved" && !update.resolvedAt) {
    update.resolvedAt = new Date();
  }

  await tip.update(update);
  return tip;
};

const getTipStats = async (tenantId) => {
  const where = tenantId ? { tenantId } : {};

  const total = await db.whistleblowerTip.count({ where });
  const pending = await db.whistleblowerTip.count({ where: { ...where, status: "pending" } });
  const reviewing = await db.whistleblowerTip.count({ where: { ...where, status: "reviewing" } });
  const resolved = await db.whistleblowerTip.count({ where: { ...where, status: "resolved" } });

  const byCategory = await db.whistleblowerTip.findAll({
    where,
    attributes: [
      "category",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
    ],
    group: ["category"],
    raw: true,
  });

  return {
    total,
    pending,
    reviewing,
    resolved,
    byCategory: byCategory.map((r) => ({ category: r.category, count: parseInt(r.count, 10) })),
  };
};

module.exports = {
  createTip,
  getTips,
  getTipById,
  updateTipStatus,
  getTipStats,
};
