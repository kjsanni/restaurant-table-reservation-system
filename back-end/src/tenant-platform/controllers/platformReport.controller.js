const platformReportDAO = require("../DAOs/platformReport.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const { reportQueue, safeAdd } = require("../../queues/queue");
const reportService = require("../../services/reportService");
const PDFDocument = require("pdfkit");

const listPlatformReportsHandler = async (req, res) => {
  const { reportType, status } = req.query;
  const data = await platformReportDAO.list({
    reportType: reportType || undefined,
    status: status || undefined,
  });
  res.status(200).json({ success: true, collection: data });
};

const createPlatformReportHandler = async (req, res) => {
  const { name, reportType, format, filters, schedule } = req.body;
  if (!name || !reportType || !format) {
    return res.status(400).json({ success: false, message: "name, reportType, and format are required" });
  }

  const report = await platformReportDAO.create({
    name,
    reportType,
    format,
    filters: filters || null,
    schedule: schedule || null,
    status: "pending",
    createdBy: req.user?.id || null,
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.report_created",
    "platform_report",
    report.id,
    null,
    { name, reportType, format },
    req.ip
  );

  const queued = await safeAdd(reportQueue, "platform-report", {
    type: format,
    filters: filters || {},
    tenantId: null,
    platformReportId: report.id,
    reportType,
  });

  if (queued.enqueued) {
    await platformReportDAO.update(report.id, { status: "processing" });
  }

  res.status(201).json({ success: true, item: report, queued: queued.enqueued });
};

const getPlatformReportHandler = async (req, res) => {
  const report = await platformReportDAO.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }
  res.status(200).json({ success: true, item: report });
};

const downloadPlatformReportHandler = async (req, res) => {
  const report = await platformReportDAO.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  const filters = report.filters || {};
  const tenantId = null;

  try {
    if (report.format === "csv") {
      const csv = await reportService.exportCSV(filters, tenantId);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${report.name || "report"}.csv`);
      return res.send(csv);
    }

    if (report.format === "pdf") {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${report.name || "report"}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).text(report.name || "Platform Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown();
      doc.text(`Report Type: ${report.reportType}`);
      doc.text(`Period: ${filters.from || "N/A"} to ${filters.to || "N/A"}`);
      doc.end();

      await platformReportDAO.update(report.id, {
        status: "completed",
        completedAt: new Date(),
      });
      return;
    }

    return res.status(400).json({ success: false, message: "Unsupported format" });
  } catch (err) {
    await platformReportDAO.update(report.id, {
      status: "failed",
      error: err.message,
    });
    return res.status(500).json({ success: false, message: "Failed to generate report" });
  }
};

const deletePlatformReportHandler = async (req, res) => {
  const report = await platformReportDAO.remove(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  await platformAuditDAO.log(
    req.user?.id || null,
    "platform.report_deleted",
    "platform_report",
    report.id,
    null,
    { name: report.name },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listPlatformReportsHandler,
  createPlatformReportHandler,
  getPlatformReportHandler,
  downloadPlatformReportHandler,
  deletePlatformReportHandler,
};
