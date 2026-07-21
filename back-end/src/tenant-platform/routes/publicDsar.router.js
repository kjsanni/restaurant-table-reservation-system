const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const { authLimiter } = require("../../middleware/rateLimit");
const publicDsarController = require("../controllers/publicDsar.controller");

router
  .route("/")
  .post(authLimiter, tryCatchHandler(publicDsarController.submitHandler))
  .all(httpMethodError);

module.exports = router;
