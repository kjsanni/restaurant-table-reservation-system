const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
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
