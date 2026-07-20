const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const orderController = require("../controllers/order.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/")
  .get(protectedRoute("view_orders", orderController.getOrdersHandler))
  .post(generalLimiter, writeRoute("edit_orders", orderController.createOrderHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/search")
  .get(protectedRoute("view_orders", orderController.searchOrdersHandler))
  .all(httpMethodError);

router
  .route("/stats")
  .get(protectedRoute("view_orders", orderController.getOrderStatsHandler))
  .all(httpMethodError);

router
  .route("/:orderId")
  .get(protectedRoute("view_orders", orderController.getOrderHandler))
  .patch(writeRoute("edit_orders", orderController.updateOrderHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/:orderId/cancel")
  .post(writeRoute("edit_orders", orderController.cancelOrderHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/:orderId/discount")
  .patch(writeRoute("edit_orders", orderController.applyDiscountHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/customer/orders")
  .get(protectedRoute("view_orders", orderController.getCustomerOrdersHandler))
  .all(httpMethodError);

router
  .route("/reservations/:reservationId/orders")
  .get(protectedRoute("view_orders", orderController.getReservationOrdersHandler))
  .all(httpMethodError);

router
  .route("/:orderId/payments")
  .get(protectedRoute("view_orders", orderController.getOrderPaymentsHandler))
  .post(writeRoute("edit_orders", orderController.addOrderPaymentHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/:orderId/payments/initialize")
  .post(writeRoute("manage_staff", orderController.initializeOrderPaymentHandler))
  .all(httpMethodError);

router
  .route("/track/:orderId")
  .get(orderController.trackOrderHandler)
  .all(httpMethodError);

module.exports = router;
