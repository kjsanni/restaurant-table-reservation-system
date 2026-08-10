const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const deploymentController = require("../controllers/deployment.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(deploymentController.getDeploymentStatusHandler))
  .all(httpMethodError);

router
  .route("/health")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(deploymentController.getDeploymentHealthHandler))
  .all(httpMethodError);

module.exports = router;
