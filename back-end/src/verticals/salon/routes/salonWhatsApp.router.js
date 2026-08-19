// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped webhookLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const { webhookLimiter } = require("../../../middleware/rateLimit");
const salonWhatsAppController = require("../controllers/salonWhatsApp.controller");

router
  .route("/whatsapp/payment-confirmation")
  .post(tryCatchHandler(webhookLimiter), tryCatchHandler(salonWhatsAppController.salonPaymentConfirmationHandler))
  .all(httpMethodError);

module.exports = router;
