const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const bulkController = require("../controllers/bulkAction.controller");
const { protect, requirePermission } = require("../../middleware/auth");
const { tenantWriteLimiter } = require("../../tenant-platform/middleware/tenantRateLimit");

router
  .route("/suspend")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkSuspendHandler))
  .all(httpMethodError);

router
  .route("/change-plan")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkChangePlanHandler))
  .all(httpMethodError);

router
  .route("/send-email")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkSendEmailHandler))
  .all(httpMethodError);

router
  .route("/change-vertical")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(bulkController.bulkChangeVerticalHandler))
  .all(httpMethodError);

router
  .route("/enable")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkEnableHandler))
  .all(httpMethodError);

router
  .route("/export")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkExportHandler))
  .all(httpMethodError);

router
  .route("/feature-flags")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkAssignFeatureFlagsHandler))
  .all(httpMethodError);

router
  .route("/delete")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkDeleteHandler))
  .all(httpMethodError);

router
  .route("/provision")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(bulkController.bulkProvisionHandler))
  .all(httpMethodError);

module.exports = router;
