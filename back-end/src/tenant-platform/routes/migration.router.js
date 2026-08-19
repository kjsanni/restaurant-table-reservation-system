
const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const migrationController = require("../controllers/migration.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.getMigrationStatusHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.getMigrationStatusHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/run/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.runTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/pause/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.pauseTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/resume/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.resumeTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/rollback/:migrationName")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(migrationController.rollbackTenantMigrationHandler))
  .all(httpMethodError);

module.exports = router;
