const reportService = require("../services/reportService");
const PDFDocument = require("pdfkit");

const getReservationReportHandler = async (req, res) => {
  const filters = {
    from: req.query.from,
    to: req.query.to,
    paymentStatus: req.query.paymentStatus,
    resStatus: req.query.resStatus,
  };
  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }
  const report = await reportService.getReservationReport(filters, req.tenant?.id, pagination);
  return res.status(200).json({ success: true, report });
};

const exportCSVHandler = async (req, res) => {
  const filters = {
    from: req.query.from,
    to: req.query.to,
    paymentStatus: req.query.paymentStatus,
    resStatus: req.query.resStatus,
  };
  const csv = await reportService.exportCSV(filters, req.tenant?.id);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=reservations.csv");
  res.send(csv);
};

const exportPDFHandler = async (req, res) => {
  const filters = {
    from: req.query.from,
    to: req.query.to,
    paymentStatus: req.query.paymentStatus,
    resStatus: req.query.resStatus,
  };
  const report = await reportService.getReservationReport(filters, req.tenant?.id);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=reservations.pdf");

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("Reservation Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
  doc.text(`Period: ${filters.from || "N/A"} to ${filters.to || "N/A"}`);
  doc.moveDown();
  doc.text(`Total Reservations: ${report.totalReservations}`);
  doc.moveDown();

  if (report.stats && report.stats.paymentBreakdown) {
    doc.text("Payment Breakdown:");
    report.stats.paymentBreakdown.byMethod.forEach((m) => {
      doc.text(`  ${m.method}: $${m.total.toFixed(2)} (${m.count} payments)`);
    });
    doc.text(`Total Revenue: $${report.stats.paymentBreakdown.total.toFixed(2)}`);
    doc.moveDown();
  }

  doc.text("Reservations:");
  report.reservations.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.resDate} ${r.resTime} - ${r.people} people - ${r.resStatus}`);
  });

  doc.end();
};

const getTurnTimeHandler = async (req, res) => {
  const filters = {
    from: req.query.from,
    to: req.query.to,
    tableIds: req.query.tableIds,
  };
  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }
  const report = await reportService.getTurnTimeReport(filters, req.tenant?.id, pagination);
  return res.status(200).json({ success: true, report });
};

module.exports = {
  getReservationReportHandler,
  exportCSVHandler,
  exportPDFHandler,
  getTurnTimeHandler,
};