const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const featureFlagController = require("../controllers/featureFlag.controller");
const { protect, requireSuperAdmin, requirePermission } = require("../../middleware/auth");
const { logAction } = require("../../middleware/auditLog");

router
  .route("/")
  .get(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.listFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/global")
  .get(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.getGlobalFeatureFlagsHandler))
  .put(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.updateGlobalFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id")
  .get(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.getTenantFeatureFlagsHandler))
  .patch(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.updateTenantFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/salon-module")
  .post(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.toggleSalonModuleHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/audit-log")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.getFlagAuditLogHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/bulk")
  .post(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.bulkCategoryActionHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/reset")
  .post(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.resetTenantFlagsHandler))
  .all(httpMethodError);

router
  .route("/presets")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.listFlagPresetsHandler))
  .post(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.createFlagPresetHandler))
  .all(httpMethodError);

router
  .route("/presets/:presetId/apply/:id")
  .post(tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(featureFlagController.applyFlagPresetHandler))
  .all(httpMethodError);

module.exports = router;
