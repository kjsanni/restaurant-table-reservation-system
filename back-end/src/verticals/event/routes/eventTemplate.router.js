"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const eventTemplateController = require("../controllers/eventTemplate.controller");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventTemplateController.getEventTemplatesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventTemplateController.createEventTemplateHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(tenantLimiter), tryCatchHandler(eventTemplateController.getEventTemplateHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventTemplateController.updateEventTemplateHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventTemplateController.deleteEventTemplateHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
