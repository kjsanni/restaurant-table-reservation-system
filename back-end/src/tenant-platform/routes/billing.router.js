const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const billingController = require("../controllers/billing.controller");

router
  .route("/webhook")
  .post(tryCatchHandler(billingController.webhookHandler))
  .all(httpMethodError);

router
  .route("/webhook/test")
  .get(tryCatchHandler(billingController.testWebhookHandler))
  .all(httpMethodError);

module.exports = router;
