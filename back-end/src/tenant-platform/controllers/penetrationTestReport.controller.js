const penetrationTestReportDAO = require("../DAOs/penetrationTestReport.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listPenetrationTestReportsHandler = async (req, res) => {
  const { status, limit } = req.query;
  const data = await penetrationTestReportDAO.list({
    status,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getPenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Penetration test report not found" });
  }
  res.status(200).json({ success: true, item: report });
};

const createPenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.create(req.body);
  await platformAuditDAO.log(
    req.user.id,
    "penetration_test_report.created",
    "penetration_test_report",
    report.id,
    null,
    { title: report.title },
    req.ip
  );
  res.status(201).json({ success: true, item: report });
};

const updatePenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.update(req.params.id, req.body);
  if (!report) {
    return res.status(404).json({ success: false, message: "Penetration test report not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "penetration_test_report.updated",
    "penetration_test_report",
    report.id,
    null,
    { title: report.title },
    req.ip
  );
  res.status(200).json({ success: true, item: report });
};

const deletePenetrationTestReportHandler = async (req, res) => {
  const report = await penetrationTestReportDAO.remove(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Penetration test report not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "penetration_test_report.deleted",
    "penetration_test_report",
    report.id,
    null,
    { title: report.title },
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  listPenetrationTestReportsHandler,
  getPenetrationTestReportHandler,
  createPenetrationTestReportHandler,
  updatePenetrationTestReportHandler,
  deletePenetrationTestReportHandler,
};
