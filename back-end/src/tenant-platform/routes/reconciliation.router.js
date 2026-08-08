const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const reconciliationController = require("../controllers/reconciliation.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router.use(adminActionLimiter);

router
  .route("/multi-currency/totals")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(reconciliationController.getMultiCurrencyTotalsHandler))
  .all(httpMethodError);

router
  .route("/multi-currency/tenants")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_billing")), tryCatchHandler(reconciliationController.getTenantCurrencyBreakdownHandler))
  .all(httpMethodError);

module.exports = router;
