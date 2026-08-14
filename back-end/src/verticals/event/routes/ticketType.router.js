"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const { validateEventInput } = require("../middleware/validateEventInput");
const ticketTypeController = require("../controllers/ticketType.controller");

router
  .route("/:eventId/ticket-types")
  .get(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(ticketTypeController.getTicketTypesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(ticketTypeController.createTicketTypeHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:eventId/ticket-types/:ticketTypeId")
  .patch(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(ticketTypeController.updateTicketTypeHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(ticketTypeController.deleteTicketTypeHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
