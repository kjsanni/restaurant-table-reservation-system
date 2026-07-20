const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const billingEmailController = require("../controllers/billingEmail.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/payment-reminder")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(billingEmailController.sendPaymentReminderHandler))
  .all(httpMethodError);

router
  .route("/suspension-notice")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(billingEmailController.sendSuspensionNoticeHandler))
  .all(httpMethodError);

router
  .route("/trial-expiry")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(billingEmailController.sendTrialExpiryHandler))
  .all(httpMethodError);

module.exports = router;
