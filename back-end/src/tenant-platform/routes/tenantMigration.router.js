const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const tenantMigrationController = require("../controllers/tenantMigration.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/:id/migration/export")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.exportTenantMigrationHandler))
  .all(httpMethodError);

router
  .route("/migration/import")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(tenantMigrationController.importTenantMigrationHandler))
  .all(httpMethodError);

module.exports = router;
