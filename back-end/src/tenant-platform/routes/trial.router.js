const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const trialController = require("../controllers/trial.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/trial/extend")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(trialController.extendTrialHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/trial/convert")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(trialController.convertTrialHandler))
  .all(httpMethodError);

module.exports = router;
