const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const syncController = require("../controllers/sync.controller");
const { syncLimiter } = require("../middleware/rateLimit");

router
  .route("/tables")
  .get(syncLimiter, syncController.listTablesHandler)
  .all(httpMethodError);

router
  .route("/reservations")
  .get(syncLimiter, syncController.listReservationsHandler)
  .all(httpMethodError);

router
  .route("/reservation-seated")
  .post(syncLimiter, syncController.reservationSeatedHandler)
  .all(httpMethodError);

router
  .route("/payment-settled")
  .post(syncLimiter, syncController.paymentSettledHandler)
  .all(httpMethodError);

module.exports = router;
