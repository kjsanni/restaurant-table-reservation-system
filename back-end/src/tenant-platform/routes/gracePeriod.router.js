const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const gracePeriodController = require("../controllers/gracePeriod.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/grace-period")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(gracePeriodController.getGracePeriodHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(gracePeriodController.updateGracePeriodHandler))
  .all(httpMethodError);

module.exports = router;
