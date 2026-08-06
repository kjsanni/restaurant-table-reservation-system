const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const tenantAdminController = require("../controllers/tenantAdmin.controller");
const dataAnonymizationController = require("../controllers/dataAnonymization.controller");
const { protect, requirePermission, requireSuperAdmin } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/dashboard")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.getDashboardHandler))
  .all(httpMethodError);

router
  .route("/")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.createTenantHandler))
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.getTenantsHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.getTenantHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.updateTenantHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.deleteTenantHandler))
  .all(httpMethodError);

router
  .route("/:id/export")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.exportTenantDataHandler))
  .all(httpMethodError);

router
  .route("/:id/enable")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.enableTenantHandler))
  .all(httpMethodError);

router
  .route("/:id/disable")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.disableTenantHandler))
  .all(httpMethodError);

router
  .route("/:id/anonymize")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataAnonymizationController.anonymizeTenantHandler))
  .all(httpMethodError);

router
  .route("/:id/test-paystack")
  .post(adminActionLimiter, tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.testPaystackHandler))
  .all(httpMethodError);

router
  .route("/:id/test-shaqexpress")
  .post(adminActionLimiter, tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.testShaqExpressHandler))
  .all(httpMethodError);

router
  .route("/:id/gateway")
  .patch(adminActionLimiter, tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(tenantAdminController.updateGatewayHandler))
  .all(httpMethodError);

module.exports = router;
