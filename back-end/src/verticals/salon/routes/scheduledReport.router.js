"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const scheduledReportController = require("../../../controllers/scheduledReport.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");

router
  .route("/scheduled-reports")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(scheduledReportController.listScheduledReportsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(scheduledReportController.createScheduledReportHandler)
  )
  .all(httpMethodError);

router
  .route("/scheduled-reports/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(scheduledReportController.listScheduledReportsHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(scheduledReportController.updateScheduledReportHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(scheduledReportController.deleteScheduledReportHandler)
  )
  .all(httpMethodError);

router
  .route("/scheduled-reports/:id/run")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(scheduledReportController.runScheduledReportHandler)
  )
  .all(httpMethodError);

module.exports = router;
