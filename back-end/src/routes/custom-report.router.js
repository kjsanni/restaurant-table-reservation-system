const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const customReportController = require("../controllers/custom-report.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/sources")
  .get(generalLimiter, protect, requirePermission("view_reports"), customReportController.getReportSourcesHandler)
  .all(httpMethodError);

router
  .route("/run")
  .post(generalLimiter, protect, requirePermission("view_reports"), validateCsrfToken, customReportController.runCustomReportHandler)
  .all(httpMethodError);

router
  .route("/export/csv")
  .post(generalLimiter, protect, requirePermission("view_reports"), validateCsrfToken, customReportController.exportCustomReportCSVHandler)
  .all(httpMethodError);

module.exports = router;
