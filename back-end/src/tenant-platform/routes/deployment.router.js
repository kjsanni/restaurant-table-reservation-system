const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const deploymentController = require("../controllers/deployment.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(deploymentController.getDeploymentStatusHandler))
  .all(httpMethodError);

router
  .route("/health")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(deploymentController.getDeploymentHealthHandler))
  .all(httpMethodError);

module.exports = router;
