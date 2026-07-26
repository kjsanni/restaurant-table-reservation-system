const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const monitoringController = require("../controllers/monitoring.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/queues")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(monitoringController.getQueueStatsHandler))
  .all(httpMethodError);

router
  .route("/database")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(monitoringController.getDatabaseStatsHandler))
  .all(httpMethodError);

router
  .route("/errors")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(monitoringController.getErrorRateHandler))
  .all(httpMethodError);

router
  .route("/integrations/latency")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(monitoringController.getIntegrationLatencyHandler))
  .all(httpMethodError);

module.exports = router;
