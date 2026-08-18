const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const legalAcceptanceController = require("../controllers/legalAcceptance.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/legal-acceptances")
  .get(
    tryCatchHandler(protect), tryCatchHandler(adminActionLimiter),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(legalAcceptanceController.getAcceptancesHandler)
  )
  .post(
    tryCatchHandler(protect), tryCatchHandler(adminActionLimiter),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(legalAcceptanceController.acceptHandler)
  )
  .all(httpMethodError);

module.exports = router;
