// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const { protect, requireSuperAdmin } = require("../../../middleware/auth");
const { adminActionLimiter } = require("../../../middleware/rateLimit");
const erpnextController = require("../../../tenant-platform/controllers/erpnext.controller");

router
  .route("/tenants")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(erpnextController.listErpnextTenantsHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(erpnextController.getErpnextTenantHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/provision")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(erpnextController.provisionErpnextModuleHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/deprovision")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(erpnextController.deprovisionErpnextModuleHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/sync")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(erpnextController.triggerSyncHandler))
  .all(httpMethodError);

router
  .route("/tenants/:id/sync/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(erpnextController.getSyncStatusHandler))
  .all(httpMethodError);

module.exports = router;