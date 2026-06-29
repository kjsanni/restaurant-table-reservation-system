const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const waitlistController = require("../controllers/waitlist.controller");
const { protect, staff, requirePermission } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("manage_tables", waitlistController.getAllHandler))
  .post(tryCatchHandler(staff), validateCsrfToken, tryCatchHandler(waitlistController.createHandler))
  .all(httpMethodError);

router
  .route("/stats")
  .get(...protectedRoute("manage_tables", waitlistController.getStatsHandler))
  .all(httpMethodError);

router
  .route("/:id/seat")
  .post(...writeRoute("manage_tables", waitlistController.seatHandler))
  .all(httpMethodError);

router
  .route("/:id/cancel")
  .post(...writeRoute("manage_tables", waitlistController.cancelHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .delete(...writeRoute("manage_tables", waitlistController.deleteHandler))
  .all(httpMethodError);

router
  .route("/maintenance/expire")
  .post(...writeRoute("manage_tables", waitlistController.expireOldHandler))
  .all(httpMethodError);

module.exports = router;
