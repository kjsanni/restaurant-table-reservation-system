const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataAnonymizationController = require("../controllers/dataAnonymization.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/tenants/:tenantId/anonymize")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataAnonymizationController.anonymizeTenantHandler))
  .all(httpMethodError);

module.exports = router;
