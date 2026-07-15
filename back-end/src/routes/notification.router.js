const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const notificationController = require("../controllers/notification.controller");
const { protect, admin } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/email/test")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(admin),
    validateCsrfToken,
    tryCatchHandler(notificationController.sendTestEmailHandler)
  )
  .all(httpMethodError);

router
  .route("/email")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(admin),
    validateCsrfToken,
    tryCatchHandler(notificationController.sendEmailHandler)
  )
  .all(httpMethodError);

router
  .route("/email/template")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(admin),
    validateCsrfToken,
    tryCatchHandler(notificationController.sendTemplateHandler)
  )
  .all(httpMethodError);

router
  .route("/templates")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(admin),
    tryCatchHandler(notificationController.getTemplatesHandler)
  )
  .all(httpMethodError);

module.exports = router;
