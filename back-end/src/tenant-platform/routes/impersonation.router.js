const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const impersonationController = require("../controllers/impersonation.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.listImpersonationHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.startImpersonationHandler))
  .all(httpMethodError);

router
  .route("/:id/end")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.endImpersonationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/impersonate")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.startImpersonationByTenantHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/sessions")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.getActiveSessionsHandler))
  .all(httpMethodError);

module.exports = router;
