"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const { validateEventInput } = require("../middleware/validateEventInput");
const eventController = require("../controllers/event.controller");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(eventController.getEventsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(eventController.createEventHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(eventController.getEventHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(eventController.updateEventHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventController.deleteEventHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
