const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const emailVerificationController = require("../controllers/emailVerification.controller");
const { generalLimiter } = require("../middleware/rateLimit");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/verify-email/request")
  .post(
    generalLimiter,
    validateCsrfToken,
    tryCatchHandler(emailVerificationController.requestVerificationHandler)
  )
  .all(httpMethodError);

router
  .route("/verify-email")
  .post(
    generalLimiter,
    validateCsrfToken,
    tryCatchHandler(emailVerificationController.verifyEmailHandler)
  )
  .all(httpMethodError);

module.exports = router;
