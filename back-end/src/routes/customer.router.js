const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const customerController = require("../controllers/customer.controller");
const { protect } = require("../middleware/auth");
const { generalLimiter } = require("../middleware/rateLimit");
const { validateCsrfToken } = require("../middleware/csrf");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/find-or-create")
  .post(generalLimiter, tryCatchHandler(protect), validateCsrfToken, tryCatchHandler(customerController.findOrCreateHandler))
  .all(httpMethodError);

router
  .route("/:customerId/profile")
  .get(...protectedRoute("view_reservations", customerController.getCustomerProfileHandler))
  .all(httpMethodError);

router
  .route("/:customerId/visits")
  .post(...writeRoute("manage_staff", customerController.incrementVisitHandler))
  .all(httpMethodError);

router
  .route("/:customerId/points")
  .post(...writeRoute("manage_staff", customerController.addPointsHandler))
  .all(httpMethodError);

router
  .route("/:customerId/points/redeem")
  .post(...writeRoute("manage_staff", customerController.redeemPointsHandler))
  .all(httpMethodError);

router
  .route("/:customerId/preferences")
  .patch(...writeRoute("manage_staff", customerController.updatePreferencesHandler))
  .all(httpMethodError);

router
  .route("/search")
  .get(...protectedRoute("view_reservations", customerController.searchCustomersHandler))
  .all(httpMethodError);

router
  .route("/check-whatsapp")
  .post(generalLimiter, tryCatchHandler(customerController.checkWhatsAppHandler))
  .all(httpMethodError);

router
  .route("/send-otp")
  .post(generalLimiter, tryCatchHandler(customerController.sendOtpHandler))
  .all(httpMethodError);

router
  .route("/verify-otp")
  .post(generalLimiter, tryCatchHandler(customerController.verifyOtpHandler))
  .all(httpMethodError);

module.exports = router;
