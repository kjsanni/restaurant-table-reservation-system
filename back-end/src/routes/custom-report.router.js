const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const customReportController = require("../controllers/custom-report.controller");
const { protect } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/sources")
  .get(protect, customReportController.getReportSourcesHandler)
  .all(httpMethodError);

router
  .route("/run")
  .post(protect, validateCsrfToken, customReportController.runCustomReportHandler)
  .all(httpMethodError);

router
  .route("/export/csv")
  .post(protect, validateCsrfToken, customReportController.exportCustomReportCSVHandler)
  .all(httpMethodError);

module.exports = router;
