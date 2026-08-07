const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const customReportController = require("../controllers/custom-report.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/sources")
  .get(protect, requirePermission("view_reports"), customReportController.getReportSourcesHandler)
  .all(httpMethodError);

router
  .route("/run")
  .post(protect, requirePermission("view_reports"), validateCsrfToken, customReportController.runCustomReportHandler)
  .all(httpMethodError);

router
  .route("/export/csv")
  .post(protect, requirePermission("view_reports"), validateCsrfToken, customReportController.exportCustomReportCSVHandler)
  .all(httpMethodError);

module.exports = router;
