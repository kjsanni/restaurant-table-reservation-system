"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateScannerApiKey } = require("../middleware/scannerAuth");
const upload = require("../middleware/photoUpload");
const photoController = require("../controllers/photo.controller");

router
  .route("/upload")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(upload.single("photo")), tryCatchHandler(photoController.uploadPhoto))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:photoRef")
  .get(tryCatchHandler(protect), tryCatchHandler(photoController.getPhoto))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
