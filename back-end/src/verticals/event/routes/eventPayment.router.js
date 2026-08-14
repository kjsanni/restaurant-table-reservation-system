"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect } = require("../../../middleware/auth");
const { validateCsrfToken } = require("../../../middleware");
const { tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const eventPaymentController = require("../controllers/eventPayment.controller");

router
  .route("/:bookingId/payments/initialize")
  .post(tryCatchHandler(protect), tryCatchHandler(tenantWriteLimiter), tryCatchHandler(validateCsrfToken), tryCatchHandler(eventPaymentController.initializeBookingPaymentHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
