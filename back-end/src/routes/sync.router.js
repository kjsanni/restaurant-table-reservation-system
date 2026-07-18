const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const syncController = require("../controllers/sync.controller");

router
  .route("/tables")
  .get(syncController.listTablesHandler)
  .all(httpMethodError);

router
  .route("/reservations")
  .get(syncController.listReservationsHandler)
  .all(httpMethodError);

router
  .route("/reservation-seated")
  .post(syncController.reservationSeatedHandler)
  .all(httpMethodError);

router
  .route("/payment-settled")
  .post(syncController.paymentSettledHandler)
  .all(httpMethodError);

module.exports = router;
