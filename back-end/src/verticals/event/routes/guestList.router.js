// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped tenantLimiter middleware in all routes
"use strict";

const express = require("express");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const router = express.Router();
router.use(tenantLimiter);
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requirePermission } = require("../../../middleware/auth");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { validateEventInput } = require("../middleware/validateEventInput");
const guestListController = require("../controllers/guestList.controller");

router
  .route("/:eventId/guests")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("view_events")), tryCatchHandler(guestListController.getGuestListHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(guestListController.addGuestHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:eventId/guests/:guestId/qr-code")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(guestListController.generateGuestQRCodeHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:eventId/guests/:guestId")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(validateEventInput), tryCatchHandler(guestListController.updateGuestHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_events")), tryCatchHandler(validateCsrfToken), tryCatchHandler(guestListController.removeGuestHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
