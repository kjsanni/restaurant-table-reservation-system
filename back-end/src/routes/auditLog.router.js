const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const auditLogController = require("../controllers/auditLog.controller");
const { protectedRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("view_audit_logs", auditLogController.getLogsHandler))
  .all(httpMethodError);

module.exports = router;
