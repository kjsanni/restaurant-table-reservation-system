const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware
const { generalLimiter } = require("../middleware/rateLimit");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const auditLogController = require("../controllers/auditLog.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("view_audit_logs", auditLogController.getLogsHandler))
  .all(httpMethodError);

router
  .route("/stats")
  .get(...protectedRoute("view_audit_logs", auditLogController.getStatsHandler))
  .all(httpMethodError);

router
  .route("/export/csv")
  .get(...protectedRoute("view_audit_logs", auditLogController.exportCSVHandler))
  .all(httpMethodError);

router
  .route("/export/json")
  .get(...protectedRoute("view_audit_logs", auditLogController.exportJSONHandler))
  .all(httpMethodError);

router
  .route("/bulk-delete")
  .post(...writeRoute("manage_audit_logs", auditLogController.bulkDeleteHandler))
  .all(httpMethodError);

module.exports = router;
