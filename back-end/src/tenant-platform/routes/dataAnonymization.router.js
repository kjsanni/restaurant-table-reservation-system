
const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataAnonymizationController = require("../controllers/dataAnonymization.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/tenants/:tenantId/anonymize")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(dataAnonymizationController.anonymizeTenantHandler))
  .all(httpMethodError);

module.exports = router;
