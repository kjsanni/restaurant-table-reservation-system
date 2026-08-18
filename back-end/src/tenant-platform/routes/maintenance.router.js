const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const maintenanceController = require("../controllers/maintenance.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(maintenanceController.getMaintenanceModeHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(maintenanceController.setMaintenanceModeHandler))
  .all(httpMethodError);

module.exports = router;
