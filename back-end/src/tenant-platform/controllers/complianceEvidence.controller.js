const complianceEvidenceDAO = require("../DAOs/complianceEvidence.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

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
    return res.status(404).json({ success: false, message: "Compliance evidence not found" });
  }
  res.status(200).json({ success: true, item });
};

const createComplianceEvidenceHandler = async (req, res) => {
  const item = await complianceEvidenceDAO.create(req.body);
  await platformAuditDAO.log(
    req.user.id,
    "compliance_evidence.created",
    "compliance_evidence",
    item.id,
    null,
    { framework: item.framework, controlId: item.controlId },
    req.ip
  );
  res.status(201).json({ success: true, item });
};

const updateComplianceEvidenceHandler = async (req, res) => {
  const item = await complianceEvidenceDAO.update(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({ success: false, message: "Compliance evidence not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "compliance_evidence.updated",
    "compliance_evidence",
    item.id,
    null,
    { framework: item.framework, controlId: item.controlId },
    req.ip
  );
  res.status(200).json({ success: true, item });
};

const deleteComplianceEvidenceHandler = async (req, res) => {
  const item = await complianceEvidenceDAO.remove(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: "Compliance evidence not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "compliance_evidence.deleted",
    "compliance_evidence",
    item.id,
    null,
    { framework: item.framework, controlId: item.controlId },
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  listComplianceEvidenceHandler,
  getComplianceEvidenceHandler,
  createComplianceEvidenceHandler,
  updateComplianceEvidenceHandler,
  deleteComplianceEvidenceHandler,
};
