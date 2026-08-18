const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataAnonymizationController = require("../controllers/dataAnonymization.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/tenants/:tenantId/anonymize")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataAnonymizationController.anonymizeTenantHandler))
  .all(httpMethodError);

module.exports = router;
