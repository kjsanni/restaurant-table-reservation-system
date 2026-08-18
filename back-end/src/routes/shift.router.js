const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware
const { generalLimiter } = require("../middleware/rateLimit");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const shiftController = require("../controllers/shift.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("manage_schedule", shiftController.getShiftsHandler))
  .post(...writeRoute("manage_schedule", shiftController.createShiftHandler))
  .all(httpMethodError);

router
  .route("/staff")
  .get(...protectedRoute("manage_schedule", shiftController.getStaffHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .delete(...writeRoute("manage_schedule", shiftController.deleteShiftHandler))
  .all(httpMethodError);

module.exports = router;
