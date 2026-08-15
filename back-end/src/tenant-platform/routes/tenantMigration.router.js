const express = require("express");
const router = express.Router({ mergeParams: true });
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const tenantMigrationController = require("../controllers/tenantMigration.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/:tenantId/migrations")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.listTenantMigrationsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.enqueueTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/migrations/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.getTenantMigrationStatusHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/migration/export")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), async (req, res) => {
    res.set("Deprecation", "true");
    res.set("Sunset", "2026-12-31");
    res.set("Link", "</api/v1/admin/tenants/:tenantId/migrations>; rel=\"successor-version\"");
    req.url = `/api/v1/admin/tenants/${req.params.tenantId}/migrations`;
    return tenantMigrationController.listTenantMigrationsHandler(req, res);
  })
  .all(httpMethodError);

router
  .route("/migration/import")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), async (req, res) => {
    res.set("Deprecation", "true");
    res.set("Sunset", "2026-12-31");
    res.set("Link", "</api/v1/admin/tenants/:tenantId/migrations>; rel=\"successor-version\"");
    req.url = `/api/v1/admin/tenants/${req.params.tenantId}/migrations`;
    return tenantMigrationController.enqueueTenantMigrationHandler(req, res);
  })
  .all(httpMethodError);

router
  .route("/migrations/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.getTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/migrations/:id/run")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.runTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/migrations/:id/pause")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.pauseTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/migrations/:id/resume")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.resumeTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/migrations/:id/rollback")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.rollbackTenantMigrationHandler))
  .all(httpMethodError);

module.exports = router;
