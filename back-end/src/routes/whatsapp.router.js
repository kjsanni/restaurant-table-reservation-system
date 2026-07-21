const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const whatsappController = require("../controllers/whatsapp.controller");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/inbound")
  .post(generalLimiter, whatsappController.inboundHandler)
  .all(httpMethodError);

router
  .route("/webhook")
  .get(whatsappController.verifyTokenHandler)
  .all(httpMethodError);

module.exports = router;
