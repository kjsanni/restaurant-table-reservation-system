const { Worker, Queue } = require("bullmq");
const { connection, defaultJobOptions, registerQueue } = require("./queue");
const logger = require("../utils/logger");
const backupRecordDAO = require("../tenant-platform/DAOs/backupRecord.dao");
const backupService = require("../tenant-platform/services/backup.service");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const DLQ_NAME = "backups-dlq";
const dlqQueue = connection ? new Queue(DLQ_NAME, { connection }) : null;
if (dlqQueue) registerQueue(dlqQueue);

let backupWorker = null;

const moveToDLQ = async (job, err) => {
  if (!dlqQueue || !job) return;
  try {
    await dlqQueue.add(
      "failed-backup",
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
    logger.error("[BackupWorker] Moved job to DLQ", {
      jobId: job.id,
      backupId: job.data?.backupId,
      error: err ? err.message : "unknown",
    });
  } catch (dlqErr) {
    logger.error("[BackupWorker] Failed to move job to DLQ", {
      jobId: job?.id,
      error: dlqErr.message,
    });
  }
};

const startBackupWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "backups",
    async (job) => {
      const { backupId, type } = job.data;
      const record = await backupRecordDAO.findById(backupId);
      if (!record) {
        return { skipped: true, reason: "backup_not_found" };
      }

      await backupRecordDAO.update(record.id, {
        status: "running",
        startedAt: new Date(),
      });

      try {
        const result = await backupService.runBackup({ type: record.type });
        await backupRecordDAO.update(record.id, {
          status: "completed",
          sizeBytes: result.sizeBytes,
          storagePath: result.path,
          completedAt: new Date(),
          lastRunAt: new Date(),
        });

        await platformAuditDAO.log(
          null,
          "backup.completed",
          "backup",
          record.id,
          null,
          { type: record.type, sizeBytes: result.sizeBytes },
          null
        );

        return { success: true, backupId: record.id };
      } catch (err) {
        await backupRecordDAO.update(record.id, {
          status: "failed",
          error: err.message || "Backup failed",
          completedAt: new Date(),
        });

        await platformAuditDAO.log(
          null,
          "backup.failed",
          "backup",
          record.id,
          null,
          { error: err.message || "Backup failed" },
          null
        );

        throw err;
      }
    },
    {
      connection,
      concurrency: 1,
      ...defaultJobOptions,
      deadLetterStrategy: { maxStalledCount: 1, maxAttempts: defaultJobOptions.attempts },
    }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    const isFinalAttempt = job.attemptsMade >= (job.opts?.attempts || defaultJobOptions.attempts);
    logger.error(`[BackupWorker] Job ${job?.id} failed:`, err.message);
    if (isFinalAttempt) {
      moveToDLQ(job, err);
    }
  });

  worker.on("error", (err) => {
    logger.error("[BackupWorker] Worker error:", err.message);
  });

  backupWorker = worker;
  return worker;
};

const closeBackupWorker = async () => {
  if (backupWorker) {
    try {
      await backupWorker.close();
    } catch (err) {
      logger.warn("[BackupWorker] Failed to close worker:", err.message);
    } finally {
      backupWorker = null;
    }
  }
};

module.exports = {
  startBackupWorker,
  closeBackupWorker,
  DLQ_NAME,
};
