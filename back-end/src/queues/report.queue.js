const { Worker, Queue } = require("bullmq");
const { connection, defaultJobOptions, registerQueue } = require("./queue");
const logger = require("../utils/logger");
const db = require("../db/models");

const DLQ_NAME = "reports-dlq";
const dlqQueue = connection ? new Queue(DLQ_NAME, { connection }) : null;
if (dlqQueue) registerQueue(dlqQueue);

let reportWorker = null;

const isTenantActive = async (tenantId) => {
  if (!tenantId || !db.tenant) return true;
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) return true;
  return ["active", "past_due", "trialing"].includes(tenant.status);
};

const moveToDLQ = async (job, err) => {
  if (!dlqQueue || !job) return;
  try {
    await dlqQueue.add(
      "failed-report",
      {
        originalId: job.id,
        originalName: job.name,
        data: job.data,
        failedReason: err ? err.message : "unknown",
        stack: err ? err.stack : undefined,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      },
      { removeOnComplete: { age: 30 * 24 * 3600 } }
    );
    logger.error("[ReportWorker] Moved job to DLQ", {
      jobId: job.id,
      type: job.data?.type,
      tenantId: job.data?.tenantId,
      error: err ? err.message : "unknown",
    });
  } catch (dlqErr) {
    logger.error("[ReportWorker] Failed to move job to DLQ", {
      jobId: job?.id,
      error: dlqErr.message,
    });
  }
};

const startReportWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "reports",
    async (job) => {
      const { type, filters, tenantId } = job.data;
      if (!(await isTenantActive(tenantId))) {
        return { skipped: true, reason: "tenant_suspended" };
      }
      switch (type) {
        case "csv":
          return await generateCSVReport(filters, tenantId);
        case "pdf":
          return await generatePDFReport(filters, tenantId);
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
    },
    {
      connection,
      concurrency: 2,
      ...defaultJobOptions,
      deadLetterStrategy: { maxStalledCount: 1, maxAttempts: defaultJobOptions.attempts },
    }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    const isFinalAttempt = job.attemptsMade >= (job.opts?.attempts || defaultJobOptions.attempts);
    logger.error(`[ReportWorker] Job ${job?.id} failed:`, err.message);
    if (isFinalAttempt) {
      moveToDLQ(job, err);
    }
  });

  worker.on("error", (err) => {
    logger.error("[ReportWorker] Worker error:", err.message);
  });

  reportWorker = worker;
  return worker;
};

const closeReportWorker = async () => {
  if (reportWorker) {
    try {
      await reportWorker.close();
    } catch (err) {
      logger.warn("[ReportWorker] Failed to close worker:", err.message);
    } finally {
      reportWorker = null;
    }
  }
};

const generateCSVReport = async (filters, tenantId) => {
  const reportService = require("../services/reportService");
  return await reportService.exportCSV(filters, tenantId);
};

const generatePDFReport = async (filters, tenantId) => {
  const reportService = require("../services/reportService");
  return await reportService.exportPDF(filters, tenantId);
};

module.exports = {
  startReportWorker,
  closeReportWorker,
  DLQ_NAME,
};
