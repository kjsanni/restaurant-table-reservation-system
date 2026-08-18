// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const migrationController = require("../controllers/migration.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(migrationController.getMigrationStatusHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(migrationController.getMigrationStatusHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/run/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(migrationController.runTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/pause/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(migrationController.pauseTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/resume/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(migrationController.resumeTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/rollback/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(migrationController.rollbackTenantMigrationHandler))
  .all(httpMethodError);

module.exports = router;
