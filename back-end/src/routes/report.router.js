const express = require("express");
const router = express.Router();
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

router
  .route("/turn-time")
  .get(...protectedRoute("view_reservations", reportController.getTurnTimeHandler))
  .all(httpMethodError);

router
  .route("/time-series")
  .get(...protectedRoute("view_reservations", reportController.getTimeSeriesHandler))
  .all(httpMethodError);

router
  .route("/customers")
  .get(...protectedRoute("view_reservations", reportController.getCustomerAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/tables/utilization")
  .get(...protectedRoute("view_reservations", reportController.getTableUtilizationHandler))
  .all(httpMethodError);

router
  .route("/no-shows")
  .get(...protectedRoute("view_reservations", reportController.getNoShowAnalyticsHandler))
  .all(httpMethodError);

module.exports = router;
