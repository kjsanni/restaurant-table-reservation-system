const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const incidentController = require("../controllers/incident.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/:tenantId/lock-tenant")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(incidentController.lockTenantHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/reset-tokens")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(incidentController.resetTenantTokensHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/force-logout")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(incidentController.forceLogoutTenantHandler))
  .all(httpMethodError);

module.exports = router;
