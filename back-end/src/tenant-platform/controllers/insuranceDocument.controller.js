const insuranceDocumentDAO = require("../DAOs/insuranceDocument.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listInsuranceDocumentsHandler = async (req, res) => {
  const { status, limit } = req.query;
  const data = await insuranceDocumentDAO.list({
    status,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getInsuranceDocumentHandler = async (req, res) => {
  const document = await insuranceDocumentDAO.findById(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, message: "Insurance document not found" });
  }
  res.status(200).json({ success: true, item: document });
};

const createInsuranceDocumentHandler = async (req, res) => {
  const document = await insuranceDocumentDAO.create(req.body);
  await platformAuditDAO.log(
    req.user.id,
    "insurance_document.created",
    "insurance_document",
    document.id,
    null,
    { title: document.title },
    req.ip
  );
  res.status(201).json({ success: true, item: document });
};

const updateInsuranceDocumentHandler = async (req, res) => {
  const document = await insuranceDocumentDAO.update(req.params.id, req.body);
  if (!document) {
    return res.status(404).json({ success: false, message: "Insurance document not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "insurance_document.updated",
    "insurance_document",
    document.id,
    null,
    { title: document.title },
    req.ip
  );
  res.status(200).json({ success: true, item: document });
};

const deleteInsuranceDocumentHandler = async (req, res) => {
  const document = await insuranceDocumentDAO.remove(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, message: "Insurance document not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "insurance_document.deleted",
    "insurance_document",
    document.id,
    null,
    { title: document.title },
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  listInsuranceDocumentsHandler,
  getInsuranceDocumentHandler,
  createInsuranceDocumentHandler,
  updateInsuranceDocumentHandler,
  deleteInsuranceDocumentHandler,
};
