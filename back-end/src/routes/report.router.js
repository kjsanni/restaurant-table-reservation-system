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

module.exports = router;
