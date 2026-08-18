const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const autoScalingTriggerController = require("../controllers/autoScalingTrigger.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(autoScalingTriggerController.listAutoScalingTriggersHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(autoScalingTriggerController.createAutoScalingTriggerHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(autoScalingTriggerController.getAutoScalingTriggerHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(autoScalingTriggerController.updateAutoScalingTriggerHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(autoScalingTriggerController.deleteAutoScalingTriggerHandler))
  .all(httpMethodError);

module.exports = router;
