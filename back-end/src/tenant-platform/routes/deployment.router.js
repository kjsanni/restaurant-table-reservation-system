const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const deploymentController = require("../controllers/deployment.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(deploymentController.getDeploymentStatusHandler))
  .all(httpMethodError);

router
  .route("/health")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(deploymentController.getDeploymentHealthHandler))
  .all(httpMethodError);

module.exports = router;
