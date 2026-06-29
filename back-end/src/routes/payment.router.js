const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const paymentController = require("../controllers/payment.controller");
const { protectedRoute } = require("../utils/routeHelpers");

router
  .route("/history")
  .get(...protectedRoute("view_reservations", paymentController.getHistoryHandler))
  .all(httpMethodError);

router
  .route("/revenue")
  .get(...protectedRoute("view_reservations", paymentController.getRevenueStatsHandler))
  .all(httpMethodError);

module.exports = router;
