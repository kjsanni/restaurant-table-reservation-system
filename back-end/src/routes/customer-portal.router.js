const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const customerPortalController = require("../controllers/customer-portal.controller");
const { protect } = require("../middleware/auth");

router
  .route("/profile")
  .get(protect, customerPortalController.getCustomerProfileHandler)
  .patch(protect, customerPortalController.updateCustomerProfileHandler)
  .all(httpMethodError);

router
  .route("/reservations")
  .get(protect, customerPortalController.getCustomerReservationsHandler)
  .all(httpMethodError);

router
  .route("/reservations/:reservationId/cancel")
  .post(protect, customerPortalController.cancelReservationHandler)
  .all(httpMethodError);

module.exports = router;
