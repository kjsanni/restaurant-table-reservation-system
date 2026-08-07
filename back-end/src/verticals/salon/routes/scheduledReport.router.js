"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const scheduledReportController = require("../../../controllers/scheduledReport.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/scheduled-reports")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(scheduledReportController.listScheduledReportsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(scheduledReportController.createScheduledReportHandler)
  )
  .all(httpMethodError);

router
  .route("/scheduled-reports/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(scheduledReportController.listScheduledReportsHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(scheduledReportController.updateScheduledReportHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(scheduledReportController.deleteScheduledReportHandler)
  )
  .all(httpMethodError);

router
  .route("/scheduled-reports/:id/run")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(scheduledReportController.runScheduledReportHandler)
  )
  .all(httpMethodError);

module.exports = router;
