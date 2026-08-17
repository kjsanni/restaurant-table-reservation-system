"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const eventBookingController = require("../controllers/eventBooking.controller");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventBookingController.getBookingsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.createBookingHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventBookingController.getBookingHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.updateBookingHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.cancelBookingHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.transferBookingHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
