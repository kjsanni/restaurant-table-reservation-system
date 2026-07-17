const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const tenantAdminController = require("../controllers/tenantAdmin.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/dashboard")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.getDashboardHandler))
  .all(httpMethodError);

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.getTenantsHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.getTenantHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.updateTenantHandler))
  .all(httpMethodError);

router
  .route("/:id/enable")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.enableTenantHandler))
  .all(httpMethodError);

router
  .route("/:id/disable")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.disableTenantHandler))
  .all(httpMethodError);

module.exports = router;
