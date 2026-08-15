"use strict";

const { Worker } = require("bullmq");
const { Queue } = require("bullmq");
const { connection, defaultJobOptions, registerQueue, safeAdd } = require("./queue");
const logger = require("../utils/logger");
const walletPassService = require("../verticals/event/services/walletPass.service");
const passSigningRequestDAO = require("../tenant-platform/DAOs/passSigningRequest.dao");
const signedPassArtifactDAO = require("../tenant-platform/DAOs/signedPassArtifact.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const DLQ_NAME = "wallet-sign-dlq";
const dlqQueue = connection ? new Queue(DLQ_NAME, { connection }) : null;
if (dlqQueue) registerQueue(dlqQueue);

const walletPassSigningQueue = connection
  ? new Queue("wallet-pass-signing", { connection })
  : null;
if (walletPassSigningQueue) registerQueue(walletPassSigningQueue);

let walletPassSigningWorker = null;

const moveToDLQ = async (job, err) => {
  if (!dlqQueue || !job) return;
  try {
    await dlqQueue.add(
      "failed-wallet-sign",
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
    logger.error("[WalletPassSigningWorker] Moved job to DLQ", {
      jobId: job.id,
      requestId: job.data?.requestId,
      error: err ? err.message : "unknown",
    });

    // Audit log — null actorUserId is intentional (system-initiated DLQ move),
    // documented here to match the pattern in provisioning.queue.js
    platformAuditDAO
      .log(
        null,
        "wallet_pass_signing.dlq_moved",
        "wallet_signing_dlq",
        job.id,
        job.data?.tenantId,
        {
          failedReason: err ? err.message : "unknown",
          attemptsMade: job.attemptsMade,
          requestId: job.data?.requestId,
        },
        null
      )
      .catch(() => {});
  } catch (dlqErr) {
    logger.error("[WalletPassSigningWorker] Failed to move job to DLQ", {
      jobId: job?.id,
      error: dlqErr.message,
    });
  }
};

const startWalletPassSigningWorker = () => {
  if (!connection) return null;

  const worker = new Worker(
    "wallet-pass-signing",
    async (job) => {
      const { requestId, tenantId } = job.data;
      if (!requestId || !tenantId) {
        throw new Error("requestId and tenantId are required for wallet pass signing");
      }

      logger.info("[WalletPassSigningWorker] Signing job started", {
        jobId: job.id,
        requestId,
        tenantId,
      });

      await passSigningRequestDAO.setSigning(requestId);

      const request = await passSigningRequestDAO.findById(requestId, tenantId);
      if (!request) {
        throw new Error(`Pass signing request ${requestId} not found`);
      }

      const designSnapshot = request.designSnapshot;
      const signResult = await walletPassService.signAllPlatforms(designSnapshot, tenantId);

      for (const [platform, artifact] of Object.entries(signResult.results)) {
        try {
          if (artifact) {
            await signedPassArtifactDAO.create({
              requestId: request.id,
              platform,
              artifactType: artifact.artifactType,
              artifactPath: artifact.artifactPath,
              accessToken: artifact.accessToken,
              error: null,
            });
            await passSigningRequestDAO.updatePlatformStatus(requestId, platform, "signed");
          } else {
            await signedPassArtifactDAO.create({
              requestId: request.id,
              platform,
              artifactType: "file",
              artifactPath: null,
              accessToken: null,
              error: signResult.errors[platform] || "Unknown error",
            });
            await passSigningRequestDAO.updatePlatformStatus(requestId, platform, "failed");
          }
        } catch (artifactErr) {
          logger.error("[WalletPassSigningWorker] Failed to record artifact", {
            requestId,
            platform,
            error: artifactErr.message,
          });
          await passSigningRequestDAO.updatePlatformStatus(requestId, platform, "failed");
        }
      }

      await passSigningRequestDAO.markCompletedIfAllDone(requestId);

      logger.info("[WalletPassSigningWorker] Signing job completed", {
        jobId: job.id,
        requestId,
        tenantId,
        results: Object.keys(signResult.results),
        errors: Object.keys(signResult.errors),
      });

      return {
        requestId,
        tenantId,
        signed: Object.keys(signResult.results).filter((k) => signResult.results[k]),
        failed: Object.keys(signResult.errors),
      };
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
    logger.error(`[WalletPassSigningWorker] Job ${job?.id} failed after ${job.attemptsMade} attempts:`, err.message);
    if (isFinalAttempt) {
      moveToDLQ(job, err);
    }
  });

  worker.on("error", (err) => {
    logger.error("[WalletPassSigningWorker] Worker error:", err.message);
  });

  walletPassSigningWorker = worker;
  return worker;
};

const enqueueWalletPassSigning = async (requestId, tenantId, options = {}) => {
  return safeAdd(walletPassSigningQueue, "wallet-sign", { requestId, tenantId }, options);
};

const closeWalletPassSigningWorker = async () => {
  if (walletPassSigningWorker) {
    try {
      await walletPassSigningWorker.close();
    } catch (err) {
      logger.warn("[WalletPassSigningWorker] Failed to close worker:", err.message);
    } finally {
      walletPassSigningWorker = null;
    }
  }
};

module.exports = {
  startWalletPassSigningWorker,
  closeWalletPassSigningWorker,
  enqueueWalletPassSigning,
  walletPassSigningQueue,
};
