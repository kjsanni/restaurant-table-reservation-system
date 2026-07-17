const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const notificationController = require("../controllers/notification.controller");
const { writeRoute, protectedRoute } = require("../utils/routeHelpers");

router
  .route("/reminders/schedule")
  .post(...writeRoute("manage_staff", notificationController.scheduleRemindersHandler))
  .all(httpMethodError);

router
  .route("/whatsapp/test")
  .post(...writeRoute("manage_settings", notificationController.testWhatsAppHandler))
  .all(httpMethodError);

router
  .route("/email/test")
  .post(...writeRoute("manage_settings", notificationController.testEmailHandler))
  .all(httpMethodError);

router
  .route("/paystack/webhook-info")
  .get(
    ...protectedRoute("manage_settings", notificationController.paystackWebhookInfoHandler)
  )
  .all(httpMethodError);

module.exports = router;
