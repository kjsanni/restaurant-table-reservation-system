const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const backupController = require("../controllers/backup.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.listBackupRecordsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.createBackupHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.getBackupRecordHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.updateBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/execute")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.executeBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/restore")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.restoreBackupHandler))
  .all(httpMethodError);

router
  .route("/:id/download")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.downloadBackupHandler))
  .all(httpMethodError);

router
  .route("/status/latest")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(backupController.getBackupStatusHandler))
  .all(httpMethodError);

module.exports = router;
