const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const revenueController = require("../controllers/revenue.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/mrr-trends")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getMrrTrendsHandler))
  .all(httpMethodError);

router
  .route("/by-plan")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getRevenueByPlanHandler))
  .all(httpMethodError);

router
  .route("/ltv")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getLtvHandler))
  .all(httpMethodError);

router
  .route("/cohorts")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getCohortAnalysisHandler))
  .all(httpMethodError);

router
  .route("/feature-adoption")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getFeatureAdoptionHandler))
  .all(httpMethodError);

router
  .route("/geographic")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(revenueController.getGeographicDistributionHandler))
  .all(httpMethodError);

module.exports = router;
