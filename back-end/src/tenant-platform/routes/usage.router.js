const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const usageController = require("../controllers/usage.controller");
const usageAlertController = require("../controllers/usageAlert.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(usageController.listTenantUsageHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(usageAlertController.checkOverageAlertsHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(usageController.getTenantUsageHandler))
  .all(httpMethodError);

router
  .route("/:id/alerts")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(usageAlertController.getTenantAlertsHandler))
  .all(httpMethodError);

module.exports = router;
