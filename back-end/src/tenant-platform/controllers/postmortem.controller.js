const response = require("../utils/response");

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const createPostmortemHandler = async (req, res) => {
  const { incidentId, summary, rootCause, impact, remediation, followUpActions } = req.body;
  if (!incidentId || !summary) {
    return response.badRequest(res, "incidentId and summary are required");
  }

  const incident = await db.incident.findByPk(incidentId);
  if (!incident) {
    return response.notFound(res, "Incident not found");
  }

  const postmortem = await db.incidentPostmortem.create({
    incidentId,
    summary,
    rootCause: rootCause || null,
    impact: impact || null,
    remediation: remediation || null,
    followUpActions: followUpActions || null,
    createdBy: req.user.id,
  });

await auditLog(req, "postmortem.created", "incident_postmortem", postmortem.id, { incidentId, summary }, { tenantId: incident.tenantId });

  res.status(201).json({ success: true, item: postmortem });
};

const listPostmortemsHandler = async (req, res) => {
  const where = {};
  if (req.query.incidentId) where.incidentId = req.query.incidentId;

  const { count, rows } = await db.incidentPostmortem.findAndCountAll({
    where,
    include: [
      { model: db.incident, as: "incident", attributes: ["id", "title", "severity", "status"] },
      { model: db.user, as: "author", attributes: ["id", "username", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({ success: true, total: count, collection: rows });
};

module.exports = {
  createPostmortemHandler,
  listPostmortemsHandler,
};
