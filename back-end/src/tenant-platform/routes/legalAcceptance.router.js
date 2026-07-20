const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const legalAcceptanceController = require("../controllers/legalAcceptance.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/legal-acceptances")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(legalAcceptanceController.getAcceptancesHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(legalAcceptanceController.acceptHandler)
  )
  .all(httpMethodError);

module.exports = router;
