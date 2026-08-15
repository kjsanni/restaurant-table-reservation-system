const response = require("../utils/response");

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const authDAO = require("../../DAOs/auth.dao");
const auditLog = require("../utils/auditLog");

const listIncidentsHandler = async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.severity) where.severity = req.query.severity;
  if (req.query.tenantId) where.tenantId = req.query.tenantId;

  const { count, rows } = await db.incident.findAndCountAll({
    where,
    include: [
      { model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] },
      { model: db.user, as: "resolver", attributes: ["id", "username", "email"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0,
  });

  res.status(200).json({ success: true, total: count, collection: rows });
};

const createIncidentHandler = async (req, res) => {
  const { title, description, severity, affectedTenantIds, metadata } = req.body;
  if (!title) {
    return response.badRequest(res, "title is required");
  }

  const incident = await db.incident.create({
    title,
    description,
    severity: severity || "medium",
    tenantId: null,
    affectedTenantIds: affectedTenantIds || null,
    metadata: metadata || null,
    status: "open",
  });

await auditLog(req, "incident.created", "incident", incident.id, { title, severity: incident.severity });

  res.status(201).json({ success: true, item: incident });
};

const updateIncidentHandler = async (req, res) => {
  const incident = await db.incident.findByPk(req.params.id);
  if (!incident) {
    return response.notFound(res, "Incident not found");
  }

  const allowed = ["status", "severity", "title", "description", "affectedTenantIds", "metadata"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  if (updates.status === "resolved" || updates.status === "closed") {
    updates.resolvedAt = new Date();
    updates.resolvedBy = req.user.id;
  }

  await incident.update(updates);

  await auditLog(req, "incident.updated", "incident", incident.id, { updates }, { tenantId: incident.tenantId });

  res.status(200).json({ success: true, item: incident });
};

const deleteIncidentHandler = async (req, res) => {
  const incident = await db.incident.findByPk(req.params.id);
  if (!incident) {
    return response.notFound(res, "Incident not found");
  }

  await incident.destroy();

  await auditLog(req, "incident.deleted", "incident", incident.id, { title: incident.title }, { tenantId: incident.tenantId });

  res.status(200).json({ success: true });
};

const lockTenantHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  await tenant.update({ status: "suspended", suspendedReason: "Locked by platform admin via incident response" });

await auditLog(req, "incident.tenant_locked", "tenant", tenant.id, { tenantName: tenant.name, tenantSlug: tenant.slug }, { tenantId: tenant.id });

  res.status(200).json({ success: true, message: "Tenant locked", item: tenant });
};

const resetTenantTokensHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const users = await authDAO.getAllUsers(tenant.id);
  const userIds = users.map((u) => u.id);
  for (const userId of userIds) {
    await authDAO.revokeAllUserTokens(userId, tenant.id);
  }

await auditLog(req, "incident.tokens_reset", "tenant", tenant.id, { tenantName: tenant.name, tenantSlug: tenant.slug, usersReset: userIds.length }, { tenantId: tenant.id });

  res.status(200).json({ success: true, message: "All tenant tokens reset", usersReset: userIds.length });
};

const forceLogoutTenantHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const users = await authDAO.getAllUsers(tenant.id);
  const userIds = users.map((u) => u.id);
  for (const userId of userIds) {
    await authDAO.revokeAllUserTokens(userId, tenant.id);
  }

await auditLog(req, "incident.force_logout", "tenant", tenant.id, { tenantName: tenant.name, tenantSlug: tenant.slug, usersLoggedOut: userIds.length }, { tenantId: tenant.id });

  res.status(200).json({ success: true, message: "All tenant sessions terminated", usersLoggedOut: userIds.length });
};

module.exports = {
  listIncidentsHandler,
  createIncidentHandler,
  updateIncidentHandler,
  deleteIncidentHandler,
  lockTenantHandler,
  resetTenantTokensHandler,
  forceLogoutTenantHandler,
};
