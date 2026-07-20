const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const apiKeyController = require("../../tenant-platform/controllers/apiKey.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/api-keys")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(apiKeyController.listApiKeysHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(apiKeyController.createApiKeyHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/api-keys/:id/revoke")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(apiKeyController.revokeApiKeyHandler))
  .all(httpMethodError);

module.exports = router;
