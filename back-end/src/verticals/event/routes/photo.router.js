"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateScannerApiKey } = require("../middleware/scannerAuth");
const { makeTenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const upload = require("../middleware/photoUpload");
const photoController = require("../controllers/photo.controller");

const photoLimiter = makeTenantLimiter({
  windowMs: 1000,
  max: 30,
  message: { success: false, error: "RATE_LIMITED", message: "Too many photo requests" },
});

router
  .route("/upload")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(upload.single("photo")), tryCatchHandler(photoController.uploadPhoto))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:photoRef")
  .get(tryCatchHandler(protect), tryCatchHandler(photoLimiter), tryCatchHandler(photoController.getPhoto))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
