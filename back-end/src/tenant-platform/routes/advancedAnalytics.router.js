const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
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

router
  .route("/revenue")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getRevenueAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/bookings")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getBookingAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/payments")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getPaymentAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/usage")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(advancedAnalyticsController.getUsageAnalyticsHandler))
  .all(httpMethodError);

module.exports = router;
