const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const featureFlagController = require("../controllers/featureFlag.controller");
const { protect, requireSuperAdmin, requirePermission } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.listFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/global")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.getGlobalFeatureFlagsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.updateGlobalFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.getTenantFeatureFlagsHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.updateTenantFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/salon-module")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.toggleSalonModuleHandler))
  .all(httpMethodError);

module.exports = router;
