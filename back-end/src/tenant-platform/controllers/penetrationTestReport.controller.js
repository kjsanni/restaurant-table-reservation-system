const response = require("../utils/response");

const penetrationTestReportDAO = require("../DAOs/penetrationTestReport.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const listPenetrationTestReportsHandler = async (req, res) => {
  const { status: queryStatus, limit } = req.query;
  const data = await penetrationTestReportDAO.list({
    queryStatus,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getPenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.findById(req.params.id);
  if (!report) {
    return response.notFound(res, "Penetration test report not found");
  }
  res.status(200).json({ success: true, item: report });
};

const createPenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.create(req.body);
  await auditLog(req, "penetration_test_report.created", "penetration_test_report", report.id, { title: report.title });
  res.status(201).json({ success: true, item: report });
};

const updatePenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.update(req.params.id, req.body);
  if (!report) {
    return response.notFound(res, "Penetration test report not found");
  }
  await auditLog(req, "penetration_test_report.updated", "penetration_test_report", report.id, { title: report.title });
  res.status(200).json({ success: true, item: report });
};

const deletePenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.remove(req.params.id);
  if (!report) {
    return response.notFound(res, "Penetration test report not found");
  }
  await auditLog(req, "penetration_test_report.deleted", "penetration_test_report", report.id, { title: report.title });
  res.status(200).json({ success: true });
};

module.exports = {
  listPenetrationTestReportsHandler,
  getPenetrationTestReportHandler,
  createPenetrationTestReportHandler,
  updatePenetrationTestReportHandler,
  deletePenetrationTestReportHandler,
};
