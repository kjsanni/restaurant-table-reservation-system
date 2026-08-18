const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
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
