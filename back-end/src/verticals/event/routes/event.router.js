"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const { validateEventInput } = require("../middleware/validateEventInput");
const eventController = require("../controllers/event.controller");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventController.getEventsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(eventController.createEventHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventController.getEventHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(eventController.updateEventHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventController.deleteEventHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
