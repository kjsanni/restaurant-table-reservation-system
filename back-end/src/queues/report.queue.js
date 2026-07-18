const { Worker } = require("bullmq");
const { connection } = require("./queue");

const startReportWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "reports",
    async (job) => {
      const { type, filters, tenantId } = job.data;
      switch (type) {
        case "csv":
          return await generateCSVReport(filters, tenantId);
        case "pdf":
          return await generatePDFReport(filters, tenantId);
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[ReportWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
};

const generateCSVReport = async (filters, tenantId) => {
  const reportService = require("../services/reportService");
  return await reportService.exportReservationsCSV(filters, tenantId);
};

const generatePDFReport = async (filters, tenantId) => {
  const reportService = require("../services/reportService");
  return await reportService.exportReservationsPDF(filters, tenantId);
};

module.exports = { startReportWorker };
