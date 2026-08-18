// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped tenantLimiter middleware in all routes
"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect } = require("../../../middleware/auth");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const eventPaymentController = require("../controllers/eventPayment.controller");

router
  .route("/:bookingId/payments/initialize")
  .post(tryCatchHandler(protect), tryCatchHandler(tenantLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventPaymentController.initializeBookingPaymentHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
