const db = require("../../db/models");
const platformAuditDAO = require("./platformAudit.dao");

const tenantAdminDAO = {};

tenantAdminDAO.findBySlug = async (slug) => {
  return db.tenant.findOne({ where: { slug } });
};

tenantAdminDAO.create = async (data, options = {}) => {
  return db.tenant.create(data, options);
};

tenantAdminDAO.list = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.plan) where.plan = filters.plan;

  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const offset = filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined;

  const { rows, count } = await db.tenant.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    attributes: [
      "id",
      "name",
      "slug",
      "domain",
      "settings",
      "plan",
      "status",
      "subscriptionStatus",
      "currentPeriodEnd",
      "graceEndsAt",
      "suspendedAt",
      "suspendedReason",
      "currency",
      "restaurantType",
      "restaurantSubtype",
      "serviceModes",
      "createdAt",
      "updatedAt",
    ],
  });

  return { rows, count };
};

tenantAdminDAO.findById = async (id) => {
  return db.tenant.findByPk(id, {
    include: [
      {
        model: db.user,
        as: "users",
        attributes: ["id", "username", "email", "role", "createdAt"],
      },
    ],
  });
};

tenantAdminDAO.update = async (id, updates) => {
  const tenant = await db.tenant.findByPk(id);
  if (!tenant) return null;
  await tenant.update(updates);
  return tenant;
};

tenantAdminDAO.setStatus = async (id, status, reason) => {
  const tenant = await db.tenant.findByPk(id);
  if (!tenant) return null;
  await tenant.update({ status, suspendedReason: reason || null });
  return tenant;
};

tenantAdminDAO.softDelete = async (id) => {
  const tenant = await db.tenant.findByPk(id);
  if (!tenant) return null;
  if (tenant.status === "cancelled") {
    const err = new Error("Tenant is already deleted");
    err.status = 400;
    err.isAlreadyDeleted = true;
    throw err;
  }
  await tenant.update({ status: "cancelled" });
  return tenant;
};

tenantAdminDAO.export = async (id) => {
  const tenant = await db.tenant.findByPk(id, {
    include: [
      {
        model: db.user,
        as: "users",
        attributes: { exclude: ["password"] },
      },
      {
        model: db.reservation,
        as: "reservations",
        include: [
          { model: db.payment, as: "payments" },
          { model: db.order, as: "orders" },
        ],
      },
      {
        model: db.customer,
        as: "customers",
      },
    ],
  });

  if (!tenant) return null;

  const settings = await db.setting.findAll({
    where: { tenantId: tenant.id },
    attributes: ["key", "value", "updatedAt"],
  });

  const notes = await db.note.findAll({
    where: { tenantId: tenant.id },
    attributes: ["id", "note", "createdAt", "updatedAt"],
  });

  const legalAcceptances = await db.legalAcceptance.findAll({
    where: { tenantId: tenant.id },
    attributes: ["id", "documentVersion", "acceptedAt", "ipAddress", "userAgent"],
  });

  return {
    tenant,
    settings,
    notes,
    legalAcceptances,
  };
};

tenantAdminDAO.log = platformAuditDAO.log.bind(platformAuditDAO);

module.exports = tenantAdminDAO;
