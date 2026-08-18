const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const customizationController = require("../controllers/tenant-customization.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/theme")
  .get(tryCatchHandler(protect), tryCatchHandler(customizationController.getThemeSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(customizationController.setThemeSettingsHandler))
  .all(httpMethodError);

router
  .route("/locale")
  .get(tryCatchHandler(protect), tryCatchHandler(customizationController.getLocaleSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(customizationController.setLocaleStringsHandler))
  .all(httpMethodError);

router
  .route("/domain")
  .get(tryCatchHandler(protect), tryCatchHandler(customizationController.getCustomDomainHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(customizationController.setCustomDomainHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_settings")), tryCatchHandler(customizationController.removeCustomDomainHandler))
  .all(httpMethodError);

module.exports = router;
