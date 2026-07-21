const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const shaqController = require("../controllers/shaqexpress.controller");
const { webhookLimiter } = require("../middleware/rateLimit");

router
  .route("/shaqexpress")
  .post(webhookLimiter, shaqController.shaqWebhookHandler)
  .all(httpMethodError);

module.exports = router;
