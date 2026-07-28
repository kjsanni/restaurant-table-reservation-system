const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformSettingsController = require("../controllers/platformSettings.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformSettingsController.listPlatformSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(validateCsrfToken), tryCatchHandler(platformSettingsController.updatePlatformSettingHandler))
  .all(httpMethodError);

module.exports = router;
