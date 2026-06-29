const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const reportController = require("../controllers/report.controller");
const { protectedRoute } = require("../utils/routeHelpers");

router
  .route("/reservations")
  .get(...protectedRoute("view_reservations", reportController.getReservationReportHandler))
  .all(httpMethodError);

router
  .route("/reservations/csv")
  .get(...protectedRoute("view_reservations", reportController.exportCSVHandler))
  .all(httpMethodError);

router
  .route("/reservations/pdf")
  .get(...protectedRoute("view_reservations", reportController.exportPDFHandler))
  .all(httpMethodError);

module.exports = router;
