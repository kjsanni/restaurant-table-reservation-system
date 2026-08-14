"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const eventBookingController = require("../controllers/eventBooking.controller");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(eventBookingController.getBookingsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.createBookingHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(eventBookingController.getBookingHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.confirmBookingHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.cancelBookingHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventBookingController.transferBookingHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
