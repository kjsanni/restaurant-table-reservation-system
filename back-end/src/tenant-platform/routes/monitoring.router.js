
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const monitoringController = require("../controllers/monitoring.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/queues")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(monitoringController.getQueueStatsHandler))
  .all(httpMethodError);

router
  .route("/database")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(monitoringController.getDatabaseStatsHandler))
  .all(httpMethodError);

router
  .route("/errors")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(monitoringController.getErrorRateHandler))
  .all(httpMethodError);

router
  .route("/integrations/latency")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(monitoringController.getIntegrationLatencyHandler))
  .all(httpMethodError);

router
  .route("/health")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(monitoringController.getHealthHandler))
  .all(httpMethodError);

module.exports = router;
