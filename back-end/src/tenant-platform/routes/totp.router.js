const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const totpController = require("../controllers/totp.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/setup")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(totpController.setupTOTPHandler))
  .all(httpMethodError);

router
  .route("/confirm")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(totpController.confirmTOTPHandler))
  .all(httpMethodError);

router
  .route("/disable")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(totpController.disableTOTPHandler))
  .all(httpMethodError);

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(totpController.totpStatusHandler))
  .all(httpMethodError);

router
  .route("/backup-codes/regenerate")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(totpController.regenerateBackupCodesHandler))
  .all(httpMethodError);

router
  .route("/backup-codes/verify")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(totpController.verifyBackupCodeHandler))
  .all(httpMethodError);

module.exports = router;
