const reportService = require("../services/reportService");

const getReservationReportHandler = async (req, res) => {
  const filters = {
    from: req.query.from,
    to: req.query.to,
    paymentStatus: req.query.paymentStatus,
    resStatus: req.query.resStatus,
  };
  const report = await reportService.getReservationReport(filters);
  return res.status(200).json({ success: true, report });
};

const exportCSVHandler = async (req, res) => {
  const filters = {
    from: req.query.from,
    to: req.query.to,
    paymentStatus: req.query.paymentStatus,
    resStatus: req.query.resStatus,
  };
  const csv = await reportService.exportCSV(filters);
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
  const pdf = await reportService.exportPDF(filters);
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", "attachment; filename=reservations.txt");
  res.send(pdf);
};

module.exports = {
  getReservationReportHandler,
  exportCSVHandler,
  exportPDFHandler,
};
