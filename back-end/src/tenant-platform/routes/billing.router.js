const express = require("express");
const { webhookLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(webhookLimiter);
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
