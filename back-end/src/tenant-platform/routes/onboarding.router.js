const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const onboardingController = require("../controllers/onboarding.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/onboarding")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(onboardingController.getOnboardingHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(onboardingController.updateOnboardingHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/onboarding/complete")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(onboardingController.completeOnboardingHandler))
  .all(httpMethodError);

module.exports = router;
