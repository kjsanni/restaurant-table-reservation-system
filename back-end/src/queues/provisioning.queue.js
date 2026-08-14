const { Worker } = require("bullmq");
const { Queue } = require("bullmq");
const { connection, defaultJobOptions, registerQueue, safeAdd } = require("./queue");
const logger = require("../utils/logger");
const provisioningService = require("../tenant-platform/services/provisioning.service");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const DLQ_NAME = "provisioning-dlq";
const dlqQueue = connection ? new Queue(DLQ_NAME, { connection }) : null;
if (dlqQueue) registerQueue(dlqQueue);

const provisioningQueue = connection ? new Queue("provisioning", { connection }) : null;
if (provisioningQueue) registerQueue(provisioningQueue);

let provisioningWorker = null;

const moveToDLQ = async (job, err) => {
  if (!dlqQueue || !job) return;
  try {
    await dlqQueue.add(
      "failed-provisioning",
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
    logger.error("[ProvisioningWorker] Moved job to DLQ", {
      jobId: job.id,
      tenantId: job.data?.tenantId,
      error: err ? err.message : "unknown",
    });
// DLQ audit log uses null as actorUserId because DLQ moves are system-initiated
// (triggered by worker 'failed' event), not user-initiated. This is intentional —
// the actor is the provisioning worker itself, not a human user.
// See: platformAuditDAO.log signature (actorUserId, action, entityType, entityId, ...)
    platformAuditDAO
      .log(
        null,
        "provisioning.dlq_moved",
        "provisioning_dlq",
        job.id,
        job.data?.tenantId,
        {
          failedReason: err ? err.message : "unknown",
          attemptsMade: job.attemptsMade,
          originalJobData: job.data,
        },
        null
      )
      .catch(() => {});
  } catch (dlqErr) {
    logger.error("[ProvisioningWorker] Failed to move job to DLQ", {
      jobId: job?.id,
      error: dlqErr.message,
    });
  }
};

const startProvisioningWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "provisioning",
    async (job) => {
      const { tenantId, initiatedBy } = job.data || {};
      if (!tenantId) {
        throw new Error("tenantId is required for provisioning");
      }
      logger.info("[ProvisioningWorker] Job started", {
        jobId: job.id,
        tenantId,
        initiatedBy,
      });
      try {
        const result = await provisioningService.startProvisioning(tenantId, initiatedBy || null);
        logger.info("[ProvisioningWorker] Job completed", {
          jobId: job.id,
          tenantId,
          status: result?.status || "unknown",
        });
        return result;
      } catch (err) {
        logger.error("[ProvisioningWorker] Job failed", {
          jobId: job.id,
          tenantId,
          error: err.message,
        });
        throw err;
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
    logger.error(`[ProvisioningWorker] Job ${job?.id} failed after ${job.attemptsMade} attempts:`, err.message);
    if (isFinalAttempt) {
      moveToDLQ(job, err);
    }
  });

  worker.on("error", (err) => {
    logger.error("[ProvisioningWorker] Worker error:", err.message);
  });

  provisioningWorker = worker;
  return worker;
};

const enqueueProvisioning = async (tenantId, initiatedBy = null) => {
  return safeAdd(provisioningQueue, "provision-tenant", { tenantId, initiatedBy });
};

const closeProvisioningWorker = async () => {
  if (provisioningWorker) {
    try {
      await provisioningWorker.close();
    } catch (err) {
      logger.warn("[ProvisioningWorker] Failed to close worker:", err.message);
    } finally {
      provisioningWorker = null;
    }
  }
};

module.exports = {
  startProvisioningWorker,
  closeProvisioningWorker,
  enqueueProvisioning,
  provisioningQueue,
};
