// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const backupController = require("../controllers/backup.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.listBackupRecordsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.createBackupHandler))
  .all(httpMethodError);

router
  .route("/scheduled")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.getScheduledBackupsHandler))
  .all(httpMethodError);

router
  .route("/status/latest")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.getBackupStatusHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.getBackupRecordHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.updateBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/execute")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.executeBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/restore")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.restoreBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/download")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.downloadBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/schedule")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(backupController.scheduleBackupHandler))
  .all(httpMethodError);

module.exports = router;
