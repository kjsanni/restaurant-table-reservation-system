const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listIncidentsHandler = async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.severity) where.severity = req.query.severity;
  if (req.query.tenantId) where.tenantId = req.query.tenantId;

  const { count, rows } = await db.incident.findAndCountAll({
    where,
    include: [
      { model: db.tenant, as: "tenant", attributes: ["id", "name", "slug"] },
      { model: db.user, as: "resolver", attributes: ["id", "name", "email"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0,
  });

  res.status(200).json({ success: true, total: count, collection: rows });
};

const createIncidentHandler = async (req, res) => {
  const { title, description, severity, tenantId, affectedTenantIds, metadata } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: "title is required" });
  }

  const incident = await db.incident.create({
    title,
    description,
    severity: severity || "medium",
    tenantId: tenantId || null,
    affectedTenantIds: affectedTenantIds || null,
    metadata: metadata || null,
    status: "open",
  });

  await platformAuditDAO.log(
    req.user.id,
    "incident.created",
    "incident",
    incident.id,
    tenantId || null,
    { title, severity: incident.severity },
    req.ip
  );

  res.status(201).json({ success: true, item: incident });
};

const updateIncidentHandler = async (req, res) => {
  const incident = await db.incident.findByPk(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
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

  await platformAuditDAO.log(
    req.user.id,
    `incident.${updates.status ? "updated" : "updated"}`,
    "incident",
    incident.id,
    incident.tenantId,
    { updates },
    req.ip
  );

  res.status(200).json({ success: true, item: incident });
};

const deleteIncidentHandler = async (req, res) => {
  const incident = await db.incident.findByPk(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  await incident.destroy();

  await platformAuditDAO.log(
    req.user.id,
    "incident.deleted",
    "incident",
    incident.id,
    incident.tenantId,
    { title: incident.title },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listIncidentsHandler,
  createIncidentHandler,
  updateIncidentHandler,
  deleteIncidentHandler,
};
