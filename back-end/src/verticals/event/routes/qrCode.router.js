"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, makeTenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const { validateEventInput } = require("../middleware/validateEventInput");
const { validateScannerApiKey } = require("../middleware/scannerAuth");
const qrCodeController = require("../controllers/qrCode.controller");

const checkinLimiter = makeTenantLimiter({
  windowMs: 1000,
  max: 10,
  keyPrefix: "event_checkin",
  message: { success: false, error: "RATE_LIMITED", message: "Too many check-in attempts" },
});

const scannerLimiter = makeTenantLimiter({
  windowMs: 1000,
  max: 5,
  keyPrefix: "event_scanner",
  message: { success: false, error: "RATE_LIMITED", message: "Scanner rate limit exceeded" },
});

router
  .route("/:eventId/qr-codes")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(qrCodeController.getQRCodesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(qrCodeController.generateQRCodeHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/scanner/config")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(qrCodeController.getScannerConfigHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:eventId/qr-codes/batch")
  .post(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(qrCodeController.generateBatchQRCodesHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/checkin/:token")
  .post(
    tryCatchHandler(validateScannerApiKey),
    tryCatchHandler(scannerLimiter),
    tryCatchHandler(checkinLimiter),
    tryCatchHandler(qrCodeController.checkinHandler)
  )
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/checkin/:token/verify")
  .get(
    tryCatchHandler(validateScannerApiKey),
    tryCatchHandler(scannerLimiter),
    tryCatchHandler(qrCodeController.verifyTokenHandler)
  )
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
