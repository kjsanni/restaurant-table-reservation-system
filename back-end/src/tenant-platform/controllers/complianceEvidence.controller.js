const response = require("../utils/response");

const complianceEvidenceDAO = require("../DAOs/complianceEvidence.dao");
const auditLog = require("../utils/auditLog");

const listComplianceEvidenceHandler = async (req, res) => {
  const { framework, status, controlId, limit } = req.query;
  const data = await complianceEvidenceDAO.list({
    framework,
    status,
    controlId,
    limit: limit ? parseInt(limit, 10) : 500,
  });
  res.status(200).json({ success: true, collection: data });
};

const getComplianceEvidenceHandler = async (req, res) => {
  const item = await complianceEvidenceDAO.findById(req.params.id);
  if (!item) {
    return response.notFound(res, "Compliance evidence not found");
  }
  res.status(200).json({ success: true, item });
};

const createComplianceEvidenceHandler = async (req, res) => {
  const allowed = ["framework", "controlId", "title", "description", "status", "owner", "dueDate", "evidenceUrl", "notes"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }

  if (!data.framework || !data.controlId || !data.title) {
    return response.badRequest(res, "framework, controlId and title are required");
  }

  const item = await complianceEvidenceDAO.create(data);
await auditLog(req, "compliance_evidence.created", "compliance_evidence", item.id, { framework: item.framework, controlId: item.controlId });
  res.status(201).json({ success: true, item });
};

const updateComplianceEvidenceHandler = async (req, res) => {
  const item = await complianceEvidenceDAO.findById(req.params.id);
  if (!item) {
    return response.notFound(res, "Compliance evidence not found");
  }

  const allowed = ["framework", "controlId", "title", "description", "status", "owner", "dueDate", "evidenceUrl", "notes"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const updated = await complianceEvidenceDAO.update(req.params.id, updates);
await auditLog(req, "compliance_evidence.updated", "compliance_evidence", item.id, { framework: updated.framework, controlId: updated.controlId });
  res.status(200).json({ success: true, item: updated });
};

const deleteComplianceEvidenceHandler = async (req, res) => {
  const item = await complianceEvidenceDAO.remove(req.params.id);
  if (!item) {
    return response.notFound(res, "Compliance evidence not found");
  }
await auditLog(req, "compliance_evidence.deleted", "compliance_evidence", item.id, { framework: item.framework, controlId: item.controlId });
  res.status(200).json({ success: true });
};

module.exports = {
  listComplianceEvidenceHandler,
  getComplianceEvidenceHandler,
  createComplianceEvidenceHandler,
  updateComplianceEvidenceHandler,
  deleteComplianceEvidenceHandler,
};
