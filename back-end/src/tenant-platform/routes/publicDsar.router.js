const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const { authLimiter } = require("../../middleware/rateLimit");
const validateTurnstile = require("../../middleware/turnstile");
const publicDsarController = require("../controllers/publicDsar.controller");

router
  .route("/")
  .post(authLimiter, validateTurnstile, tryCatchHandler(publicDsarController.submitHandler))
  .all(httpMethodError);

module.exports = router;
