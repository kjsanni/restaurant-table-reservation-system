const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const advancedAnalyticsController = require("../controllers/advancedAnalytics.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/growth")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getTenantGrowthMetricsHandler))
  .all(httpMethodError);

router
  .route("/churn")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getChurnAnalysisHandler))
  .all(httpMethodError);

router
  .route("/ltv-cac")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getLtvCacHandler))
  .all(httpMethodError);

module.exports = router;
