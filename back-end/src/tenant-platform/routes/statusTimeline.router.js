const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const statusTimelineController = require("../controllers/statusTimeline.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(statusTimelineController.getTimelineHandler))
  .all(httpMethodError);

module.exports = router;
