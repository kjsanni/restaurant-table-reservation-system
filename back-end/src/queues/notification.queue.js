const { Worker } = require("bullmq");
const { Queue } = require("bullmq");
const { connection, defaultJobOptions } = require("./queue");
const logger = require("../utils/logger");

const DLQ_NAME = "notifications-dlq";
const dlqQueue = connection ? new Queue(DLQ_NAME, { connection }) : null;

const moveToDLQ = async (job, err) => {
  if (!dlqQueue || !job) return;
  try {
    await dlqQueue.add(
      "failed-notification",
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
    logger.error("[NotificationWorker] Moved job to DLQ", {
      jobId: job.id,
      type: job.data?.type,
      tenantId: job.data?.tenantId,
      error: err ? err.message : "unknown",
    });
  } catch (dlqErr) {
    logger.error("[NotificationWorker] Failed to move job to DLQ", {
      jobId: job?.id,
      error: dlqErr.message,
    });
  }
};

const startNotificationWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "notifications",
    async (job) => {
      const { type } = job.data;
      // Reminder/confirmation/cancellation jobs are enqueued as a single batch
      // containing one payload per channel; expand and process each.
      if (type === "batch") {
        const items = Array.isArray(job.data.items) ? job.data.items : [];
        const results = [];
        for (const item of items) {
          results.push(await processItem(item));
        }
        return results;
      }
      return await processItem(job.data);
    },
    {
      connection,
      concurrency: 5,
      ...defaultJobOptions,
      deadLetterStrategy: { maxStalledCount: 1, maxAttempts: defaultJobOptions.attempts },
    }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    const isFinalAttempt = job.attemptsMade >= (job.opts?.attempts || defaultJobOptions.attempts);
    logger.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
    if (isFinalAttempt) {
      moveToDLQ(job, err);
    }
  });

  worker.on("error", (err) => {
    logger.error("[NotificationWorker] Worker error:", err.message);
  });

  return worker;
};

const processItem = async (item) => {
  const { type, payload } = item || {};
  switch (type) {
    case "email":
      return await sendEmailJob(payload);
    case "whatsapp":
      return await sendWhatsAppJob(payload);
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
};

const sendEmailJob = async (payload) => {
  const { to, templateKey, data, tenantId } = payload;
  const mailService = require("../services/mail.service");
  // mailService.sendMail is tenant-aware (emailTemplateDAO scoped by tenantId).
  return await mailService.sendMail(to, templateKey, data || {}, tenantId);
};

const sendWhatsAppJob = async (payload) => {
  const { to, text, tenantId } = payload;
  const whatsappService = require("../services/whatsapp.service");
  return await whatsappService.sendWhatsAppText(to, text, tenantId);
};

module.exports = { startNotificationWorker, DLQ_NAME };
