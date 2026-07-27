const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const reconciliationController = require("../controllers/reconciliation.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/multi-currency/totals")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(reconciliationController.getMultiCurrencyTotalsHandler))
  .all(httpMethodError);

router
  .route("/multi-currency/tenants")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(reconciliationController.getTenantCurrencyBreakdownHandler))
  .all(httpMethodError);

module.exports = router;
