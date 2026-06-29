const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const customerController = require("../controllers/customer.controller");
const { protect } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/find-or-create")
  .post(tryCatchHandler(protect), validateCsrfToken, tryCatchHandler(customerController.findOrCreateHandler))
  .all(httpMethodError);

router
  .route("/:customerId/profile")
  .get(...protectedRoute("view_reservations", customerController.getCustomerProfileHandler))
  .all(httpMethodError);

module.exports = router;
