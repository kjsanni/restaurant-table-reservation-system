const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const notificationController = require("../controllers/notification.controller");
const { protect } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(notificationController.listNotificationsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(notificationController.createNotificationHandler))
  .all(httpMethodError);

router
  .route("/:id/read")
  .post(tryCatchHandler(protect), tryCatchHandler(notificationController.markReadHandler))
  .all(httpMethodError);

module.exports = router;
