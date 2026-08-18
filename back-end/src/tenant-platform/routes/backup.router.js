
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const backupController = require("../controllers/backup.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.listBackupRecordsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.createBackupHandler))
  .all(httpMethodError);

router
  .route("/scheduled")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.getScheduledBackupsHandler))
  .all(httpMethodError);

router
  .route("/status/latest")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.getBackupStatusHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.getBackupRecordHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.updateBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/execute")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.executeBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/restore")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.restoreBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/download")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.downloadBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/schedule")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(backupController.scheduleBackupHandler))
  .all(httpMethodError);

module.exports = router;
