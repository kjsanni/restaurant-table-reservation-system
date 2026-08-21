"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { logAction } = require("../../../middleware");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const eventAnalyticsController = require("../controllers/eventAnalytics.controller");

router
  .route("/:eventId/analytics")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventAnalyticsController.getEventAnalyticsHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:eventId/analytics/trend")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventAnalyticsController.getEventAnalyticsTrendHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
