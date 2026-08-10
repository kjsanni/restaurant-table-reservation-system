const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const featureFlagController = require("../controllers/featureFlag.controller");
const { protect, requirePlatformRole, _requirePermission } = require("../../middleware/auth");
const { logAction } = require("../../middleware/auditLog");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.listFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/global")
  .get(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.getGlobalFeatureFlagsHandler))
  .put(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.updateGlobalFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id")
  .get(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.getTenantFeatureFlagsHandler))
  .patch(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.updateTenantFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/salon-module")
  .post(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.toggleSalonModuleHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/audit-log")
  .get(adminActionLimiter, tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.getFlagAuditLogHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/bulk")
  .post(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.bulkCategoryActionHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/reset")
  .post(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.resetTenantFlagsHandler))
  .all(httpMethodError);

router
  .route("/presets")
  .get(adminActionLimiter, tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.listFlagPresetsHandler))
  .post(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.createFlagPresetHandler))
  .all(httpMethodError);

router
  .route("/presets/:presetId/apply/:id")
  .post(adminActionLimiter, tryCatchHandler(logAction), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(featureFlagController.applyFlagPresetHandler))
  .all(httpMethodError);

module.exports = router;
