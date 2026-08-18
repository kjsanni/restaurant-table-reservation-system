const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const scheduleController = require("../controllers/schedule.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/schedules")
  .get(...protectedRoute("manage_schedule", scheduleController.getAllSchedulesHandler))
  .post(...writeRoute("manage_schedule", scheduleController.createScheduleHandler))
  .all(httpMethodError);

router
  .route("/schedules/:id")
  .patch(...writeRoute("manage_schedule", scheduleController.updateScheduleHandler))
  .delete(...writeRoute("manage_schedule", scheduleController.deleteScheduleHandler))
  .all(httpMethodError);

router
  .route("/holidays")
  .get(...protectedRoute("manage_schedule", scheduleController.getAllHolidaysHandler))
  .post(...writeRoute("manage_schedule", scheduleController.createHolidayHandler))
  .all(httpMethodError);

router
  .route("/holidays/:id")
  .delete(...writeRoute("manage_schedule", scheduleController.deleteHolidayHandler))
  .all(httpMethodError);

router
  .route("/export/csv")
  .get(...protectedRoute("manage_schedule", scheduleController.exportScheduleCSVHandler))
  .all(httpMethodError);

router
  .route("/export/pdf")
  .get(...protectedRoute("manage_schedule", scheduleController.exportSchedulePDFHandler))
  .all(httpMethodError);

module.exports = router;
