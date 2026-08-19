const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const meteringController = require("../controllers/metering.controller");
const { protect, requirePermission, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/tenants/:tenantId")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(meteringController.getTenantMetricsHandler))
  .all(httpMethodError);

router
  .route("/platform")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(meteringController.getPlatformMetricsHandler))
  .all(httpMethodError);

module.exports = router;
