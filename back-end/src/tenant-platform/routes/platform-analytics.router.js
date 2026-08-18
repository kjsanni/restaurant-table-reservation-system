const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformAnalyticsController = require("../controllers/platform-analytics.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/metrics")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAnalyticsController.getAggregatedMetricsHandler))
  .all(httpMethodError);

router
  .route("/cohorts")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAnalyticsController.getTenantCohortsHandler))
  .all(httpMethodError);

router
  .route("/pii-audit")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAnalyticsController.getPIIAuditLogHandler))
  .all(httpMethodError);

module.exports = router;
