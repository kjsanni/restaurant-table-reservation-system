const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformSettingsController = require("../controllers/platformSettings.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { validateCsrfToken } = require("../../middleware/csrf");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformSettingsController.listPlatformSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(validateCsrfToken), tryCatchHandler(platformSettingsController.updatePlatformSettingHandler))
  .all(httpMethodError);

router
  .route("/audit")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformSettingsController.listPlatformSettingChangesHandler))
  .all(httpMethodError);

module.exports = router;
