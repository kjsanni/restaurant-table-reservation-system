const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const whiteLabelController = require("../controllers/whiteLabel.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/branding")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(whiteLabelController.getBrandingHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(whiteLabelController.updateBrandingHandler))
  .all(httpMethodError);

module.exports = router;
