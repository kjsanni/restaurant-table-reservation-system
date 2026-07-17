const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const reservationController = require("../controllers/reservation.controller");
const paymentController = require("../controllers/payment.controller");
const { validateCsrfToken } = require("../middleware/csrf");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/search")
  .get(...protectedRoute("view_reservations", reservationController.searchHandler))
  .all(httpMethodError);

router
  .route("/recurring")
  .get(...protectedRoute("view_reservations", reservationController.getRecurringHandler))
  .all(httpMethodError);

router
  .route("/")
  .get(...protectedRoute("view_reservations", reservationController.getAllHandler))
  .post(tryCatchHandler(reservationController.registerHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/heatmap")
  .get(...protectedRoute("view_reservations", reservationController.getHeatmapHandler))
  .all(httpMethodError);

router
  .route("/heatmap-v2")
  .get(...protectedRoute("view_reservations", reservationController.getHeatmapV2Handler))
  .all(httpMethodError);

router
  .route("/stats")
  .get(...protectedRoute("view_reservations", reservationController.getStatsHandler))
  .all(httpMethodError);

router
  .route("/bulk-cancel")
  .post(...writeRoute("edit_reservations", reservationController.bulkCancelHandler))
  .all(httpMethodError);

router
  .route("/bulk-update")
  .post(...writeRoute("edit_reservations", reservationController.bulkUpdateHandler))
  .all(httpMethodError);

router
  .route("/choose-table/:reservationId")
  .post(...writeRoute("edit_reservations", reservationController.chooseTableHandler))
  .all(httpMethodError);

router
  .route("/payment-summary")
  .get(...protectedRoute("view_reservations", reservationController.getPaymentSummaryHandler))
  .all(httpMethodError);

router
  .route("/revenue/time-series")
  .get(...protectedRoute("view_reservations", reservationController.getRevenueTimeSeriesHandler))
  .all(httpMethodError);

router
  .route("/:reservationId/payments")
  .get(...protectedRoute("view_reservations", paymentController.getPaymentsHandler))
  .post(...writeRoute("edit_reservations", paymentController.addPaymentHandler))
  .all(httpMethodError);

router
  .route("/:reservationId/payments/:paymentId")
  .delete(...writeRoute("edit_reservations", paymentController.removePaymentHandler))
  .all(httpMethodError);

router
  .route("/search-notes")
  .get(...protectedRoute("view_reservations", reservationController.searchNotesHandler))
  .all(httpMethodError);

router
  .route("/:reservationId")
  .get(...protectedRoute("view_reservations", reservationController.getOneHandler))
  .patch(...writeRoute("edit_reservations", reservationController.editHandler))
  .delete(...writeRoute("edit_reservations", reservationController.cancelHandler))
  .all(httpMethodError);

router
  .route("/:reservationId/staff")
  .get(...protectedRoute("view_reservations", reservationController.getAssignedStaffHandler))
  .post(...writeRoute("manage_tables", reservationController.assignStaffHandler))
  .all(httpMethodError);

router
  .route("/:reservationId/staff/:userId")
  .delete(...writeRoute("manage_tables", reservationController.unassignStaffHandler))
  .all(httpMethodError);

router
  .route("/:reservationId/status-history")
  .get(...protectedRoute("view_reservations", reservationController.getStatusHistoryHandler))
  .all(httpMethodError);

router
  .route("/:reservationId/merge")
  .post(...writeRoute("edit_reservations", reservationController.mergeTablesHandler))
  .delete(...writeRoute("edit_reservations", reservationController.unmergeTablesHandler))
  .all(httpMethodError);

module.exports = router;
