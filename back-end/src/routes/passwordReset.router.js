const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const passwordResetController = require("../controllers/passwordReset.controller");
const { generalLimiter } = require("../middleware/rateLimit");
const { validateCsrfToken } = require("../middleware/csrf");
const enforcePasswordPolicy = require("../middleware/passwordPolicy");

router
  .route("/forgot-password")
  .post(
    generalLimiter,
    validateCsrfToken,
    tryCatchHandler(passwordResetController.forgotPasswordHandler)
  )
  .all(httpMethodError);

router
  .route("/reset-password")
  .post(
    generalLimiter,
    validateCsrfToken,
    enforcePasswordPolicy,
    tryCatchHandler(passwordResetController.resetPasswordHandler)
  )
  .all(httpMethodError);

module.exports = router;
