// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const customizationController = require("../controllers/tenant-customization.controller");
const { protect, requirePermission } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/theme")
  .get(tryCatchHandler(protect), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.getThemeSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.setThemeSettingsHandler))
  .all(httpMethodError);

router
  .route("/locale")
  .get(tryCatchHandler(protect), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.getLocaleSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.setLocaleStringsHandler))
  .all(httpMethodError);

router
  .route("/domain")
  .get(tryCatchHandler(protect), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.getCustomDomainHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.setCustomDomainHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(adminActionLimiter), tryCatchHandler(customizationController.removeCustomDomainHandler))
  .all(httpMethodError);

module.exports = router;
