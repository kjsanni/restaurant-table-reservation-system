const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const notificationController = require("../controllers/notification.controller");
const { writeRoute } = require("../utils/routeHelpers");

router
  .route("/reminders/schedule")
  .post(...writeRoute("manage_staff", notificationController.scheduleRemindersHandler))
  .all(httpMethodError);

module.exports = router;
