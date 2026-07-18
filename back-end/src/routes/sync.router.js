const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const syncController = require("../controllers/sync.controller");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/tables")
  .get(generalLimiter, syncController.listTablesHandler)
  .all(httpMethodError);

router
  .route("/reservations")
  .get(generalLimiter, syncController.listReservationsHandler)
  .all(httpMethodError);

router
  .route("/reservation-seated")
  .post(generalLimiter, syncController.reservationSeatedHandler)
  .all(httpMethodError);

router
  .route("/payment-settled")
  .post(generalLimiter, syncController.paymentSettledHandler)
  .all(httpMethodError);

module.exports = router;
