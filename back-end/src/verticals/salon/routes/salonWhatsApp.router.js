const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const salonWhatsAppController = require("../controllers/salonWhatsApp.controller");

router
  .route("/whatsapp/payment-confirmation")
  .post(tryCatchHandler(salonWhatsAppController.salonPaymentConfirmationHandler))
  .all(httpMethodError);

module.exports = router;
