const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformAuditController = require("../controllers/platformAudit.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAuditController.listPlatformAuditHandler))
  .all(httpMethodError);

router
  .route("/recent")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAuditController.recentActivityHandler))
  .all(httpMethodError);

router
  .route("/export")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAuditController.exportAuditLogHandler))
  .all(httpMethodError);

router
  .route("/user/:userId")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAuditController.listForUserHandler))
  .all(httpMethodError);

router
  .route("/tenant/:tenantId")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAuditController.listForTenantHandler))
  .all(httpMethodError);

router
  .route("/suspicious")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformAuditController.suspiciousActivityHandler))
  .all(httpMethodError);

module.exports = router;
