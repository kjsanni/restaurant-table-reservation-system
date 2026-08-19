const express = require("express");
const { generalLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(generalLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const tenantAdminController = require("../controllers/tenantAdmin.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/export")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(tenantAdminController.exportSelfTenantDataHandler)
  )
  .all(httpMethodError);

module.exports = router;
