const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const timeOffController = require("../controllers/timeOff.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("manage_schedule", timeOffController.getTimeOffsHandler))
  .post(...writeRoute("manage_schedule", timeOffController.createHandler))
  .all(httpMethodError);

router
  .route("/staff")
  .get(...protectedRoute("manage_schedule", timeOffController.getStaffHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(...writeRoute("manage_schedule", timeOffController.updateStatusHandler))
  .delete(...writeRoute("manage_schedule", timeOffController.deleteHandler))
  .all(httpMethodError);

module.exports = router;
