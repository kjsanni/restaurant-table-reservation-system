const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const deliveryController = require("../controllers/delivery.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/")
  .get(protectedRoute("view_orders", deliveryController.getDeliveriesHandler))
  .post(writeRoute("edit_orders", deliveryController.createDeliveryHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/regions")
  .get(protectedRoute("view_orders", deliveryController.getRegionsHandler))
  .all(httpMethodError);

router
  .route("/:deliveryId")
  .get(protectedRoute("view_orders", deliveryController.getDeliveryHandler))
  .all(httpMethodError);

router
  .route("/:deliveryId/sync")
  .post(writeRoute("edit_orders", deliveryController.syncDeliveryHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/:deliveryId/cancel")
  .post(writeRoute("edit_orders", deliveryController.cancelDeliveryHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/orders/:orderId")
  .get(protectedRoute("view_orders", deliveryController.getDeliveriesForOrderHandler))
  .all(httpMethodError);

router
  .route("/track/:trackingNumber")
  .get(deliveryController.trackDeliveryHandler)
  .all(httpMethodError);

module.exports = router;
