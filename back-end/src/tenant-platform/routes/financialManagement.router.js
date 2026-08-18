// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const financialController = require("../controllers/financialManagement.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/refunds")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(adminActionLimiter), tryCatchHandler(financialController.listRefundsHandler))
  .all(httpMethodError);

router
  .route("/refunds/:id/status")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(adminActionLimiter), tryCatchHandler(financialController.updateRefundStatusHandler))
  .all(httpMethodError);

router
  .route("/subscription-health")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(adminActionLimiter), tryCatchHandler(financialController.getSubscriptionHealthHandler))
  .all(httpMethodError);

router
  .route("/anomalies")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(adminActionLimiter), tryCatchHandler(financialController.detectFinancialAnomaliesHandler))
  .all(httpMethodError);

module.exports = router;
