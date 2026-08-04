const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const webhookController = require("../controllers/webhook.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { webhookLimiter } = require("../middleware/rateLimit");

router
  .route("/")
  .get(...protectedRoute("manage_settings", webhookController.listSubscriptionsHandler))
  .put(...writeRoute("manage_settings", webhookController.updateSubscriptionsHandler))
  .all(httpMethodError);

router
  .route("/test")
  .post(...writeRoute("manage_settings", webhookController.testHandler))
  .all(httpMethodError);

router
  .route("/paystack")
  .post(webhookLimiter, webhookController.paystackEventHandler)
  .all(httpMethodError);

module.exports = router;
