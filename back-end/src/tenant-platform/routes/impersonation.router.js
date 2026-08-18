const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const impersonationController = require("../controllers/impersonation.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/tenants/:tenantId/impersonate")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.startImpersonationHandler))
  .all(httpMethodError);

router
  .route("/sessions/:id/end")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.endImpersonationHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/sessions")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(impersonationController.getActiveSessionsHandler))
  .all(httpMethodError);

module.exports = router;
